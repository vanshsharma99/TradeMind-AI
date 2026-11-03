import { marketDataFeedService } from '../services/marketDataFeedService.js';
import { candleAggregatorService } from '../services/candleAggregatorService.js';
import { marketDepthService } from '../services/marketDepthService.js';

export const getFeedStatus = (req, res) => {
  const status = marketDataFeedService.getStatus();
  res.status(200).json({
    success: true,
    data: status,
  });
};

export const getLatestTicks = (req, res) => {
  const ticks = {};
  for (const [key, tick] of marketDataFeedService.latestTicks.entries()) {
    ticks[key] = tick;
  }

  res.status(200).json({
    success: true,
    data: ticks,
  });
};

export const subscribeInstruments = (req, res) => {
  const { instrumentKeys } = req.body;

  if (!Array.isArray(instrumentKeys) || instrumentKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'instrumentKeys must be a non-empty array of strings',
    });
  }

  marketDataFeedService.subscribe(instrumentKeys);

  res.status(200).json({
    success: true,
    message: `Subscribed to ${instrumentKeys.length} instruments`,
    data: marketDataFeedService.getStatus(),
  });
};

export const getCandles = (req, res) => {
  const { symbol = 'NSE_INDEX|Nifty 50', interval = '1m', limit = 100 } = req.query;

  const validSymbol = symbol.startsWith('NSE_INDEX') 
    ? symbol 
    : symbol.toLowerCase().includes('bank') 
    ? 'NSE_INDEX|Nifty Bank' 
    : 'NSE_INDEX|Nifty 50';

  const candles = candleAggregatorService.getCandles(validSymbol, interval, parseInt(limit, 10));

  res.status(200).json({
    success: true,
    symbol: validSymbol,
    interval,
    count: candles.length,
    data: candles,
  });
};

export const getMarketDepth = (req, res) => {
  const { symbol = 'NSE_INDEX|Nifty 50' } = req.query;

  const validSymbol = symbol.startsWith('NSE_INDEX')
    ? symbol
    : symbol.toLowerCase().includes('bank')
    ? 'NSE_INDEX|Nifty Bank'
    : 'NSE_INDEX|Nifty 50';

  const depth = marketDepthService.getDepth(validSymbol);

  res.status(200).json({
    success: true,
    data: depth,
  });
};

export const getMarketSummary = (req, res) => {
  const niftyDepth = marketDepthService.getDepth('NSE_INDEX|Nifty 50');
  const bankNiftyDepth = marketDepthService.getDepth('NSE_INDEX|Nifty Bank');

  res.status(200).json({
    success: true,
    data: {
      'NSE_INDEX|Nifty 50': niftyDepth,
      'NSE_INDEX|Nifty Bank': bankNiftyDepth,
    },
  });
};
