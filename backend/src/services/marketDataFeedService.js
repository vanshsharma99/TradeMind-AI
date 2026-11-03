import WebSocket from 'ws';
import axios from 'axios';
import EventEmitter from 'events';
import { UpstoxAuth } from '../models/UpstoxAuth.js';
import { decodeProtobufFeed, normalizeFeedTick } from '../websocket/protobuf/protobufDecoder.js';
import { startSandboxFeed, stopSandboxFeed } from './sandboxMarketFeed.js';

class MarketDataFeedService extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
    this.mode = 'simulated'; // 'live' | 'simulated'
    this.subscribedInstruments = new Set(['NSE_INDEX|Nifty 50', 'NSE_INDEX|Nifty Bank']);
    this.latestTicks = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelayMs = 3000;
    this.lastTickTime = null;
  }

  /**
   * Initializes market data stream (Auto-detects Live vs Sandbox mode)
   */
  async startFeed() {
    try {
      const activeAuth = await UpstoxAuth.getActiveAuth();

      // If active token exists and is not simulated, connect to live Upstox V3 WebSocket
      if (activeAuth && !activeAuth.isSimulated && activeAuth.accessToken) {
        console.log(`[Market Feed] Active Upstox session detected (${activeAuth.userId}). Initializing Live V3 WebSocket...`);
        await this.connectLiveUpstoxFeed(activeAuth.accessToken);
      } else {
        console.log('[Market Feed] No live Upstox session found. Initializing Sandbox Protobuf Feed...');
        this.startSimulatedFeed();
      }
    } catch (err) {
      console.warn(`[Market Feed Startup Warning] ${err.message}. Defaulting to Sandbox mode.`);
      this.startSimulatedFeed();
    }
  }

  /**
   * Connects to official Upstox Market Data Feed V3 WebSocket
   */
  async connectLiveUpstoxFeed(accessToken) {
    this.status = 'connecting';
    this.mode = 'live';
    this.emitStatus();

    try {
      // Step 1: Request authenticated WebSocket redirect URL from Upstox
      const authRes = await axios.get('https://api.upstox.com/v2/feed/market-data-feed/authorize', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        timeout: 8000,
      });

      const wsUrl = authRes.data?.data?.authorizedRedirectUri;
      if (!wsUrl) {
        throw new Error('Upstox did not return an authorized WebSocket redirect URI.');
      }

      console.log('[Market Feed] Dynamic Upstox V3 WebSocket URL acquired.');

      // Step 2: Establish binary WebSocket connection
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.on('open', () => {
        console.log('✅ [Market Feed] Connected to Upstox V3 Market Data Feed!');
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.emitStatus();

        // Subscribe to current instruments
        this.sendSubscriptionMessage();
      });

      this.ws.on('message', async (data) => {
        try {
          this.lastTickTime = Date.now();
          // Decode binary Protobuf buffer
          const feedResponse = await decodeProtobufFeed(data);
          this.processDecodedFeeds(feedResponse, false);
        } catch (err) {
          console.error('[Market Feed Decoder Error]', err.message);
        }
      });

      this.ws.on('close', (code, reason) => {
        console.warn(`[Market Feed] WebSocket connection closed (${code}): ${reason || 'Normal closure'}`);
        this.status = 'disconnected';
        this.emitStatus();
        this.handleReconnect(accessToken);
      });

      this.ws.on('error', (err) => {
        console.error(`[Market Feed Error] ${err.message}`);
        this.status = 'error';
        this.emitStatus();
      });
    } catch (err) {
      console.error(`[Market Feed Authorization Failed] ${err.message}`);
      console.log('[Market Feed] Falling back to Sandbox Mode to ensure platform continuity.');
      this.startSimulatedFeed();
    }
  }

  /**
   * Handles auto-reconnect with exponential backoff for live feed
   */
  handleReconnect(accessToken) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelayMs * this.reconnectAttempts;
      this.status = 'reconnecting';
      this.emitStatus();

      console.log(`[Market Feed] Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
      setTimeout(() => this.connectLiveUpstoxFeed(accessToken), delay);
    } else {
      console.warn('[Market Feed] Max live reconnect attempts reached. Switching to Sandbox Mode.');
      this.startSimulatedFeed();
    }
  }

  /**
   * Starts the sandbox feed with genuine Protobuf encoding & decoding
   */
  startSimulatedFeed() {
    this.stopLiveFeed();
    this.status = 'connected';
    this.mode = 'simulated';
    this.emitStatus();

    startSandboxFeed(async (buffer, isSimulated) => {
      try {
        this.lastTickTime = Date.now();
        const feedResponse = await decodeProtobufFeed(buffer);
        this.processDecodedFeeds(feedResponse, isSimulated);
      } catch (err) {
        console.error('[Sandbox Protobuf Process Error]', err.message);
      }
    }, 1000);
  }

  /**
   * Processes and broadcasts decoded feeds
   */
  processDecodedFeeds(feedResponse, isSimulated) {
    if (!feedResponse?.feeds) return;

    for (const [key, rawData] of Object.entries(feedResponse.feeds)) {
      const normalizedTick = normalizeFeedTick(key, rawData);
      normalizedTick.isSimulated = isSimulated;

      this.latestTicks.set(key, normalizedTick);
      // Emit tick event for socket broadcaster & downstream indicator analysis
      this.emit('market:tick', normalizedTick);
    }
  }

  /**
   * Sends subscription request to Upstox WebSocket
   */
  sendSubscriptionMessage() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subPayload = {
      guid: `tm_sub_${Date.now()}`,
      method: 'sub',
      data: {
        mode: 'full',
        instrumentKeys: Array.from(this.subscribedInstruments),
      },
    };

    this.ws.send(JSON.stringify(subPayload));
    console.log(`[Market Feed] Subscribed to ${this.subscribedInstruments.size} instruments:`, Array.from(this.subscribedInstruments));
  }

  subscribe(instrumentKeys = []) {
    instrumentKeys.forEach((key) => this.subscribedInstruments.add(key));
    if (this.mode === 'live' && this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscriptionMessage();
    }
  }

  unsubscribe(instrumentKeys = []) {
    instrumentKeys.forEach((key) => this.subscribedInstruments.delete(key));
    if (this.mode === 'live' && this.ws?.readyState === WebSocket.OPEN) {
      const unsubPayload = {
        guid: `tm_unsub_${Date.now()}`,
        method: 'unsub',
        data: {
          instrumentKeys,
        },
      };
      this.ws.send(JSON.stringify(unsubPayload));
    }
  }

  stopLiveFeed() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }

  stopFeed() {
    this.stopLiveFeed();
    stopSandboxFeed();
    this.status = 'disconnected';
    this.emitStatus();
  }

  getStatus() {
    return {
      status: this.status,
      mode: this.mode,
      protocol: 'Upstox Market Data Feed V3 (Protobuf)',
      subscribedCount: this.subscribedInstruments.size,
      subscribedInstruments: Array.from(this.subscribedInstruments),
      lastTickTime: this.lastTickTime,
      isSimulated: this.mode === 'simulated',
    };
  }

  emitStatus() {
    this.emit('feed:status', this.getStatus());
  }
}

// Singleton instance
export const marketDataFeedService = new MarketDataFeedService();
