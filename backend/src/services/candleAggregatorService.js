import EventEmitter from 'events';
import { marketDataFeedService } from './marketDataFeedService.js';

class CandleAggregatorService extends EventEmitter {
  constructor() {
    super();
    // In-memory candle storage: Map<instrumentKey, Map<interval, Array<Candle>>>
    this.candleStore = new Map();
    this.currentCandles = new Map();
    this.supportedIntervals = ['1m', '5m', '15m'];
    this.maxCandlesPerInterval = 200;

    // Listen to normalized ticks from marketDataFeedService
    marketDataFeedService.on('market:tick', (tick) => this.processTick(tick));
  }

  /**
   * Initializes historical seed candles for an instrument
   */
  initInstrumentSeed(instrumentKey, basePrice) {
    if (this.candleStore.has(instrumentKey)) return;

    const intervalMap = new Map();
    const now = Date.now();

    this.supportedIntervals.forEach((interval) => {
      const durationMs = this.getIntervalMs(interval);
      const candles = [];
      let lastClose = basePrice - 20;

      // Seed with 30 realistic initial candles for immediate charting & indicator calculations
      for (let i = 30; i >= 1; i--) {
        const candleTime = Math.floor((now - i * durationMs) / durationMs) * durationMs;
        const open = Number((lastClose + (Math.random() - 0.49) * 4).toFixed(2));
        const high = Number((Math.max(open, open + Math.random() * 8)).toFixed(2));
        const low = Number((Math.min(open, open - Math.random() * 8)).toFixed(2));
        const close = Number(((high + low) / 2 + (Math.random() - 0.5) * 2).toFixed(2));
        const volume = Math.floor(50000 + Math.random() * 75000);

        candles.push({
          time: Math.floor(candleTime / 1000), // Unix timestamp in seconds
          open,
          high,
          low,
          close,
          volume,
          isClosed: true,
        });

        lastClose = close;
      }

      intervalMap.set(interval, candles);
    });

    this.candleStore.set(instrumentKey, intervalMap);
  }

  getIntervalMs(interval) {
    switch (interval) {
      case '1m':
        return 60 * 1000;
      case '5m':
        return 5 * 60 * 1000;
      case '15m':
        return 15 * 60 * 1000;
      default:
        return 60 * 1000;
    }
  }

  /**
   * Aggregates incoming tick into standard interval candles
   */
  processTick(tick) {
    const { instrumentKey, ltp, volume, timestamp } = tick;
    if (!instrumentKey || !ltp) return;

    // Seed instrument if not present
    if (!this.candleStore.has(instrumentKey)) {
      this.initInstrumentSeed(instrumentKey, ltp);
    }

    const intervalMap = this.candleStore.get(instrumentKey);
    const tickTime = timestamp || Date.now();

    this.supportedIntervals.forEach((interval) => {
      const durationMs = this.getIntervalMs(interval);
      const candleStartTime = Math.floor(tickTime / durationMs) * durationMs;
      const candleKey = `${instrumentKey}_${interval}`;

      let currentCandle = this.currentCandles.get(candleKey);

      // Check if current candle period has completed and a new candle should start
      if (!currentCandle || currentCandle.startTime !== candleStartTime) {
        if (currentCandle) {
          // Finalize and close previous candle
          currentCandle.isClosed = true;
          const candles = intervalMap.get(interval) || [];
          candles.push({
            time: Math.floor(currentCandle.startTime / 1000),
            open: currentCandle.open,
            high: currentCandle.high,
            low: currentCandle.low,
            close: currentCandle.close,
            volume: currentCandle.volume,
            isClosed: true,
          });

          // Maintain max history window
          if (candles.length > this.maxCandlesPerInterval) {
            candles.shift();
          }
          intervalMap.set(interval, candles);

          // Emit candle close event
          this.emit('candle:close', {
            instrumentKey,
            interval,
            candle: currentCandle,
          });
        }

        // Initialize new forming candle
        currentCandle = {
          startTime: candleStartTime,
          time: Math.floor(candleStartTime / 1000),
          open: ltp,
          high: ltp,
          low: ltp,
          close: ltp,
          volume: volume || 100,
          isClosed: false,
          isSimulated: tick.isSimulated || false,
        };
      } else {
        // Update currently forming candle
        currentCandle.high = Math.max(currentCandle.high, ltp);
        currentCandle.low = Math.min(currentCandle.low, ltp);
        currentCandle.close = ltp;
        currentCandle.volume += (volume ? 50 : 25);
      }

      this.currentCandles.set(candleKey, currentCandle);

      // Emit live candle tick update
      this.emit('candle:update', {
        instrumentKey,
        interval,
        candle: currentCandle,
      });
    });
  }

  /**
   * Retrieves candle history + currently forming candle for an instrument
   */
  getCandles(instrumentKey, interval = '1m', limit = 100) {
    if (!this.candleStore.has(instrumentKey)) {
      const base = instrumentKey.includes('Bank') ? 52180 : 24530;
      this.initInstrumentSeed(instrumentKey, base);
    }

    const intervalMap = this.candleStore.get(instrumentKey);
    const history = intervalMap.get(interval) || [];
    const candleKey = `${instrumentKey}_${interval}`;
    const forming = this.currentCandles.get(candleKey);

    const result = [...history];
    if (forming && !forming.isClosed) {
      result.push({
        time: forming.time,
        open: forming.open,
        high: forming.high,
        low: forming.low,
        close: forming.close,
        volume: forming.volume,
        isClosed: false,
      });
    }

    return result.slice(-limit);
  }
}

export const candleAggregatorService = new CandleAggregatorService();
