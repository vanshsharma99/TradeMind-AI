import EventEmitter from 'events';
import { marketDataFeedService } from './marketDataFeedService.js';

class MarketDepthService extends EventEmitter {
  constructor() {
    super();
    this.depthStore = new Map();
    this.statsStore = new Map();

    marketDataFeedService.on('market:tick', (tick) => this.processTick(tick));
  }

  processTick(tick) {
    const { instrumentKey, ltp, closePrice, depth } = tick;
    if (!instrumentKey || !ltp) return;

    // 1. Update High, Low, Close stats
    let stats = this.statsStore.get(instrumentKey);
    if (!stats) {
      const baseCp = closePrice || ltp - 10;
      stats = {
        instrumentKey,
        dayOpen: baseCp + (Math.random() - 0.5) * 10,
        dayHigh: Math.max(ltp, baseCp + 60),
        dayLow: Math.min(ltp, baseCp - 40),
        closePrice: baseCp,
        cumulativeVolume: 15000000,
        cumulativeVwapSum: 15000000 * ltp,
        vwap: ltp,
      };
    }

    stats.dayHigh = Number(Math.max(stats.dayHigh, ltp).toFixed(2));
    stats.dayLow = Number(Math.min(stats.dayLow, ltp).toFixed(2));
    stats.cumulativeVolume += 150;
    stats.cumulativeVwapSum += 150 * ltp;
    stats.vwap = Number((stats.cumulativeVwapSum / stats.cumulativeVolume).toFixed(2));
    this.statsStore.set(instrumentKey, stats);

    // 2. Generate or extract 5-level market depth ladder
    let bids = [];
    let asks = [];

    if (depth && Array.isArray(depth) && depth.length > 0) {
      // Real Upstox 5-level quotes
      depth.forEach((q) => {
        if (q.bidPrice > 0) bids.push({ price: q.bidPrice, qty: q.bidQty, orders: 1 });
        if (q.askPrice > 0) asks.push({ price: q.askPrice, qty: q.askQty, orders: 1 });
      });
    } else {
      // Realistic simulated 5-level ladder around current LTP
      const step = instrumentKey.includes('Bank') ? 0.50 : 0.25;
      const spread = step * (Math.random() > 0.5 ? 2 : 1);

      let totalB = 0;
      let totalA = 0;

      for (let i = 1; i <= 5; i++) {
        const bPrice = Number((ltp - (i - 1) * step - spread / 2).toFixed(2));
        const aPrice = Number((ltp + (i - 1) * step + spread / 2).toFixed(2));
        const bQty = Math.floor(150 + Math.random() * 400);
        const aQty = Math.floor(150 + Math.random() * 400);

        bids.push({ level: i, price: bPrice, qty: bQty, orders: Math.floor(2 + Math.random() * 8) });
        asks.push({ level: i, price: aPrice, qty: aQty, orders: Math.floor(2 + Math.random() * 8) });

        totalB += bQty;
        totalA += aQty;
      }
    }

    const totalBidQty = bids.reduce((acc, b) => acc + b.qty, 0);
    const totalAskQty = asks.reduce((acc, a) => acc + a.qty, 0);
    const totalOrders = totalBidQty + totalAskQty;
    const buyerRatio = totalOrders > 0 ? Number(((totalBidQty / totalOrders) * 100).toFixed(1)) : 50;
    const sellerRatio = Number((100 - buyerRatio).toFixed(1));

    const marketDepthData = {
      instrumentKey,
      ltp,
      timestamp: Date.now(),
      bids,
      asks,
      totalBidQty,
      totalAskQty,
      buyerRatio,
      sellerRatio,
      spread: asks[0] && bids[0] ? Number((asks[0].price - bids[0].price).toFixed(2)) : 0.25,
      stats: {
        dayHigh: stats.dayHigh,
        dayLow: stats.dayLow,
        dayOpen: stats.dayOpen,
        closePrice: stats.closePrice,
        vwap: stats.vwap,
      },
    };

    this.depthStore.set(instrumentKey, marketDepthData);
    this.emit('depth:update', marketDepthData);
  }

  getDepth(instrumentKey) {
    if (!this.depthStore.has(instrumentKey)) {
      const ltp = instrumentKey.includes('Bank') ? 52180 : 24530;
      this.processTick({ instrumentKey, ltp });
    }
    return this.depthStore.get(instrumentKey);
  }

  getSummary(instrumentKey) {
    return this.depthStore.get(instrumentKey) || null;
  }
}

export const marketDepthService = new MarketDepthService();
