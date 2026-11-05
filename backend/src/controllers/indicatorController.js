import { technicalIndicatorsService } from '../services/technicalIndicatorsService.js';
import { candleAggregatorService } from '../services/candleAggregatorService.js';

/**
 * GET /api/v1/indicators
 * Returns full technical indicators bundle (RSI, EMA, VWAP, MACD, Volume, Confluence)
 */
export const getIndicators = async (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50', interval = '1m' } = req.query;
    const data = await technicalIndicatorsService.getIndicators(symbol, interval);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to calculate technical indicators: ${err.message}`,
    });
  }
};

/**
 * GET /api/v1/indicators/confluence
 * Returns high-level technical confluence conviction score and bias
 */
export const getConfluence = async (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50', interval = '1m' } = req.query;
    const data = await technicalIndicatorsService.getIndicators(symbol, interval);

    return res.status(200).json({
      success: true,
      symbol: data.symbol,
      interval: data.interval,
      spotPrice: data.spotPrice,
      confluence: data.confluence,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to calculate confluence score: ${err.message}`,
    });
  }
};

/**
 * GET /api/v1/indicators/series
 * Returns historical series arrays for chart overlay (EMA 9, EMA 21, VWAP)
 */
export const getIndicatorSeries = (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50', interval = '1m', limit = 60 } = req.query;
    const validSymbol = symbol.includes('Bank') ? 'NSE_INDEX|Nifty Bank' : 'NSE_INDEX|Nifty 50';

    const candles = candleAggregatorService.getCandles(validSymbol, interval, parseInt(limit, 10));
    const ema9Array = technicalIndicatorsService.calculateEMAArray(candles, 9);
    const ema21Array = technicalIndicatorsService.calculateEMAArray(candles, 21);

    const series = candles.map((c, i) => ({
      time: c.time,
      close: c.close,
      ema9: ema9Array[i] || c.close,
      ema21: ema21Array[i] || c.close,
    }));

    return res.status(200).json({
      success: true,
      symbol: validSymbol,
      interval,
      count: series.length,
      data: series,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to generate indicator series: ${err.message}`,
    });
  }
};
