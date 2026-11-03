import express from 'express';
import {
  getFeedStatus,
  getLatestTicks,
  subscribeInstruments,
  getCandles,
  getMarketDepth,
  getMarketSummary,
} from '../controllers/marketFeedController.js';

const router = express.Router();

router.get('/feed/status', getFeedStatus);
router.get('/feed/ticks', getLatestTicks);
router.post('/feed/subscribe', subscribeInstruments);

// Phase 4 Market Data & Depth APIs
router.get('/candles', getCandles);
router.get('/depth', getMarketDepth);
router.get('/summary', getMarketSummary);

export default router;
