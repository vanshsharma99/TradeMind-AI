import { Server } from 'socket.io';
import { config } from '../config/env.js';
import { marketDataFeedService } from '../services/marketDataFeedService.js';
import { candleAggregatorService } from '../services/candleAggregatorService.js';
import { marketDepthService } from '../services/marketDepthService.js';

let io = null;

export const initSocketServer = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Send initial status and existing ticks
    socket.emit('feed:status', marketDataFeedService.getStatus());

    const initialTicks = {};
    for (const [key, tick] of marketDataFeedService.latestTicks.entries()) {
      initialTicks[key] = tick;
    }
    socket.emit('market:init_ticks', initialTicks);

    // Send initial candles and depth
    socket.emit('candle:init', {
      'NSE_INDEX|Nifty 50': candleAggregatorService.getCandles('NSE_INDEX|Nifty 50', '1m', 30),
      'NSE_INDEX|Nifty Bank': candleAggregatorService.getCandles('NSE_INDEX|Nifty Bank', '1m', 30),
    });

    socket.emit('depth:init', {
      'NSE_INDEX|Nifty 50': marketDepthService.getDepth('NSE_INDEX|Nifty 50'),
      'NSE_INDEX|Nifty Bank': marketDepthService.getDepth('NSE_INDEX|Nifty Bank'),
    });

    // Dynamic subscription handler from frontend
    socket.on('market:subscribe', (instrumentKeys) => {
      if (Array.isArray(instrumentKeys)) {
        marketDataFeedService.subscribe(instrumentKeys);
        socket.emit('feed:status', marketDataFeedService.getStatus());
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected (${socket.id}): ${reason}`);
    });
  });

  // Relay market ticks from MarketDataFeedService to all connected browser clients
  marketDataFeedService.on('market:tick', (tick) => {
    if (io) {
      io.emit('market:tick', tick);
    }
  });

  // Relay status changes
  marketDataFeedService.on('feed:status', (status) => {
    if (io) {
      io.emit('feed:status', status);
    }
  });

  // Relay live candle updates and closed candles
  candleAggregatorService.on('candle:update', (data) => {
    if (io) {
      io.emit('candle:update', data);
    }
  });

  candleAggregatorService.on('candle:close', (data) => {
    if (io) {
      io.emit('candle:close', data);
    }
  });

  // Relay 5-level market depth & orderbook updates
  marketDepthService.on('depth:update', (data) => {
    if (io) {
      io.emit('market:depth', data);
    }
  });

  console.log('[Socket.IO] Real-time market data socket server initialized');
  return io;
};

export const getIO = () => io;

export const stopSocketServer = async () => {
  if (io) {
    await new Promise((resolve) => io.close(resolve));
    io = null;
    console.log('[Socket.IO] Socket server stopped');
  }
};
