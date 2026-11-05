/**
 * TradeMind AI - Technical Indicators Engine
 * Deterministic quantitative analytics for Indian Derivatives (NIFTY 50 & BANKNIFTY)
 * Implements: RSI (14), EMA (9, 21), VWAP, MACD (12, 26, 9), Volume Spike, and Confluence Scoring
 */

import { candleAggregatorService } from './candleAggregatorService.js';
import { marketDataFeedService } from './marketDataFeedService.js';

class TechnicalIndicatorsService {
  constructor() {
    this.cache = new Map();
    this.cacheTtlMs = 3000; // 3-second cache
  }

  /**
   * Calculates Relative Strength Index (RSI) using Wilder's Smoothing Method
   * Standard 14 periods
   * @param {Array<{close: number}>} candles
   * @param {number} period Defaults to 14
   * @returns {number|null} Current RSI value (0 to 100)
   */
  calculateRSI(candles = [], period = 14) {
    if (!candles || candles.length < period + 1) {
      return 50.0; // Default neutral if insufficient history
    }

    const closes = candles.map((c) => c.close);
    const gains = [];
    const losses = [];

    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? Math.abs(diff) : 0);
    }

    // First average gain and loss (SMA)
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Wilder's smoothed moving average for subsequent periods
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }

    if (avgLoss === 0) {
      return avgGain === 0 ? 50.0 : 100.0;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return Number(rsi.toFixed(2));
  }

  /**
   * Calculates Exponential Moving Average (EMA) for given period
   * @param {Array<{close: number}>} candles
   * @param {number} period
   * @returns {Array<number>} Array of EMA values matching candle length
   */
  calculateEMAArray(candles = [], period = 9) {
    if (!candles || candles.length === 0) return [];
    const closes = candles.map((c) => c.close);
    if (closes.length < period) {
      const sma = closes.reduce((a, b) => a + b, 0) / closes.length;
      return closes.map(() => Number(sma.toFixed(2)));
    }

    const k = 2 / (period + 1);
    const emaArray = [];

    // First EMA is SMA of first 'period' candles
    let initialSma = 0;
    for (let i = 0; i < period; i++) {
      initialSma += closes[i];
    }
    initialSma /= period;

    for (let i = 0; i < period - 1; i++) {
      emaArray.push(Number(closes[i].toFixed(2)));
    }
    emaArray.push(Number(initialSma.toFixed(2)));

    // Compute remaining EMAs
    let currentEma = initialSma;
    for (let i = period; i < closes.length; i++) {
      currentEma = closes[i] * k + currentEma * (1 - k);
      emaArray.push(Number(currentEma.toFixed(2)));
    }

    return emaArray;
  }

  /**
   * Computes latest EMA 9 and EMA 21 with Crossover Detection
   */
  calculateEMA(candles = []) {
    const ema9Array = this.calculateEMAArray(candles, 9);
    const ema21Array = this.calculateEMAArray(candles, 21);

    const len = candles.length;
    if (len === 0) {
      return {
        ema9: 0,
        ema21: 0,
        trend: 'NEUTRAL',
        crossover: 'NONE',
        spread: 0,
      };
    }

    const currentEma9 = ema9Array[len - 1] || candles[len - 1].close;
    const currentEma21 = ema21Array[len - 1] || candles[len - 1].close;
    const prevEma9 = len > 1 ? ema9Array[len - 2] : currentEma9;
    const prevEma21 = len > 1 ? ema21Array[len - 2] : currentEma21;

    let crossover = 'NONE';
    if (prevEma9 <= prevEma21 && currentEma9 > currentEma21) {
      crossover = 'GOLDEN_CROSS_BULLISH';
    } else if (prevEma9 >= prevEma21 && currentEma9 < currentEma21) {
      crossover = 'DEATH_CROSS_BEARISH';
    }

    const trend = currentEma9 > currentEma21 ? 'BULLISH' : currentEma9 < currentEma21 ? 'BEARISH' : 'NEUTRAL';
    const spread = Number((currentEma9 - currentEma21).toFixed(2));

    return {
      ema9: currentEma9,
      ema21: currentEma21,
      trend,
      crossover,
      spread,
    };
  }

  /**
   * Calculates Volume Weighted Average Price (VWAP)
   * Formula: Cumulative(Typical Price * Volume) / Cumulative(Volume)
   * Typical Price = (High + Low + Close) / 3
   */
  calculateVWAP(candles = []) {
    if (!candles || candles.length === 0) {
      return {
        vwap: 0,
        position: 'AT_VWAP',
        deviationPercent: 0,
        upperBand: 0,
        lowerBand: 0,
      };
    }

    let cumulativePv = 0;
    let cumulativeVolume = 0;
    const deviations = [];

    for (const candle of candles) {
      const tp = (candle.high + candle.low + candle.close) / 3;
      const vol = candle.volume > 0 ? candle.volume : 100;
      cumulativePv += tp * vol;
      cumulativeVolume += vol;
      deviations.push(tp);
    }

    const vwap = cumulativeVolume > 0 ? cumulativePv / cumulativeVolume : candles[candles.length - 1].close;
    const currentPrice = candles[candles.length - 1].close;
    const deviationPercent = Number((((currentPrice - vwap) / vwap) * 100).toFixed(2));

    // Standard deviation for VWAP bands
    const variance = deviations.reduce((sum, tp) => sum + Math.pow(tp - vwap, 2), 0) / deviations.length;
    const stdDev = Math.sqrt(variance);

    const position = currentPrice > vwap ? 'ABOVE_VWAP_BULLISH' : currentPrice < vwap ? 'BELOW_VWAP_BEARISH' : 'AT_VWAP';

    return {
      vwap: Number(vwap.toFixed(2)),
      position,
      deviationPercent,
      upperBand: Number((vwap + stdDev).toFixed(2)),
      lowerBand: Number((vwap - stdDev).toFixed(2)),
    };
  }

  /**
   * Calculates Moving Average Convergence Divergence (MACD)
   * Standard: Fast 12, Slow 26, Signal 9
   */
  calculateMACD(candles = []) {
    if (!candles || candles.length < 26) {
      return {
        macdLine: 0,
        signalLine: 0,
        histogram: 0,
        crossover: 'NONE',
        momentum: 'NEUTRAL',
      };
    }

    const fastEma = this.calculateEMAArray(candles, 12);
    const slowEma = this.calculateEMAArray(candles, 26);

    const macdSeries = [];
    for (let i = 0; i < candles.length; i++) {
      macdSeries.push({ close: fastEma[i] - slowEma[i] });
    }

    const signalArray = this.calculateEMAArray(macdSeries, 9);
    const len = candles.length;

    const currentMacd = Number((macdSeries[len - 1].close).toFixed(2));
    const currentSignal = Number((signalArray[len - 1]).toFixed(2));
    const currentHist = Number((currentMacd - currentSignal).toFixed(2));

    const prevMacd = len > 1 ? macdSeries[len - 2].close : currentMacd;
    const prevSignal = len > 1 ? signalArray[len - 2] : currentSignal;
    const prevHist = Number((prevMacd - prevSignal).toFixed(2));

    let crossover = 'NONE';
    if (prevMacd <= prevSignal && currentMacd > currentSignal) {
      crossover = 'BULLISH_CROSS';
    } else if (prevMacd >= prevSignal && currentMacd < currentSignal) {
      crossover = 'BEARISH_CROSS';
    }

    let momentum = 'NEUTRAL';
    if (currentHist > 0 && currentHist >= prevHist) {
      momentum = 'ACCELERATING_BULLISH';
    } else if (currentHist > 0 && currentHist < prevHist) {
      momentum = 'DECELERATING_BULLISH';
    } else if (currentHist < 0 && currentHist <= prevHist) {
      momentum = 'ACCELERATING_BEARISH';
    } else if (currentHist < 0 && currentHist > prevHist) {
      momentum = 'DECELERATING_BEARISH';
    }

    return {
      macdLine: currentMacd,
      signalLine: currentSignal,
      histogram: currentHist,
      crossover,
      momentum,
    };
  }

  /**
   * Volume Profile & Spike Analysis
   * Compares current volume against 20-period volume SMA
   */
  calculateVolumeAnalysis(candles = []) {
    if (!candles || candles.length === 0) {
      return {
        currentVolume: 0,
        averageVolume: 0,
        spikeRatio: 1.0,
        isSpike: false,
        status: 'NORMAL',
      };
    }

    const currentVolume = candles[candles.length - 1].volume || 100;
    const lookback = Math.min(20, candles.length);
    const volumeSlice = candles.slice(-lookback).map((c) => c.volume || 100);
    const averageVolume = Math.round(volumeSlice.reduce((a, b) => a + b, 0) / lookback);

    const spikeRatio = averageVolume > 0 ? Number((currentVolume / averageVolume).toFixed(2)) : 1.0;
    const isSpike = spikeRatio >= 1.5;
    const status = isSpike ? 'VOLUME_SPIKE' : spikeRatio < 0.7 ? 'LOW_VOLUME' : 'NORMAL';

    return {
      currentVolume,
      averageVolume,
      spikeRatio,
      isSpike,
      status,
    };
  }

  /**
   * Computes Comprehensive Technical Confluence Score (0 to 100)
   * Weights:
   *  - EMA 9/21 Trend & Cross: 25%
   *  - VWAP Position: 20%
   *  - RSI (14) Momentum: 20%
   *  - MACD Signal & Hist: 20%
   *  - Volume Spike: 15%
   */
  calculateConfluenceScore(rsi, ema, vwap, macd, volume) {
    let score = 50; // Neutral baseline

    // 1. EMA 9/21 Analysis (Weight: 25)
    if (ema.crossover === 'GOLDEN_CROSS_BULLISH') score += 15;
    else if (ema.crossover === 'DEATH_CROSS_BEARISH') score -= 15;
    else if (ema.trend === 'BULLISH') score += 10;
    else if (ema.trend === 'BEARISH') score -= 10;

    // 2. VWAP Analysis (Weight: 20)
    if (vwap.position === 'ABOVE_VWAP_BULLISH') {
      score += 10;
      if (vwap.deviationPercent > 0.1 && vwap.deviationPercent < 1.0) score += 5; // Healthy trend
    } else if (vwap.position === 'BELOW_VWAP_BEARISH') {
      score -= 10;
      if (vwap.deviationPercent < -0.1 && vwap.deviationPercent > -1.0) score -= 5;
    }

    // 3. RSI Analysis (Weight: 20)
    if (rsi > 70) {
      score -= 10; // Overbought condition caution
    } else if (rsi < 30) {
      score += 10; // Oversold reversal potential
    } else if (rsi >= 55) {
      score += 10; // Strong bullish momentum
    } else if (rsi <= 45) {
      score -= 10; // Strong bearish momentum
    }

    // 4. MACD Analysis (Weight: 20)
    if (macd.crossover === 'BULLISH_CROSS') score += 12;
    else if (macd.crossover === 'BEARISH_CROSS') score -= 12;
    else if (macd.momentum === 'ACCELERATING_BULLISH') score += 8;
    else if (macd.momentum === 'ACCELERATING_BEARISH') score -= 8;

    // 5. Volume Confirmation (Weight: 15)
    if (volume.isSpike) {
      // Amplify current direction
      if (score > 50) score += 10;
      else if (score < 50) score -= 10;
    }

    // Clamp score between 0 and 100
    score = Math.max(5, Math.min(95, score));

    let sentiment = 'NEUTRAL';
    let recommendation = 'HOLD';

    if (score >= 70) {
      sentiment = 'STRONG_BULLISH';
      recommendation = 'FAVORS_CALL_BUY';
    } else if (score >= 58) {
      sentiment = 'MILD_BULLISH';
      recommendation = 'LEAN_CALL_BUY';
    } else if (score <= 30) {
      sentiment = 'STRONG_BEARISH';
      recommendation = 'FAVORS_PUT_BUY';
    } else if (score <= 42) {
      sentiment = 'MILD_BEARISH';
      recommendation = 'LEAN_PUT_BUY';
    }

    return {
      score,
      sentiment,
      recommendation,
    };
  }

  /**
   * Generates full technical indicators bundle for given symbol and interval
   */
  async getIndicators(symbol = 'NSE_INDEX|Nifty 50', interval = '1m') {
    const validSymbol = symbol.includes('Bank') ? 'NSE_INDEX|Nifty Bank' : 'NSE_INDEX|Nifty 50';
    const cacheKey = `${validSymbol}_${interval}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    // Get candles from candle aggregator
    const candles = candleAggregatorService.getCandles(validSymbol, interval, 60);

    // Compute all indicators
    const rsi = this.calculateRSI(candles, 14);
    const ema = this.calculateEMA(candles);
    const vwap = this.calculateVWAP(candles);
    const macd = this.calculateMACD(candles);
    const volume = this.calculateVolumeAnalysis(candles);
    const confluence = this.calculateConfluenceScore(rsi, ema, vwap, macd, volume);

    const latestTick = marketDataFeedService.latestTicks.get(validSymbol);
    const spotPrice = latestTick?.ltp || (candles.length > 0 ? candles[candles.length - 1].close : 24536.6);

    const result = {
      symbol: validSymbol,
      interval,
      spotPrice,
      timestamp: Date.now(),
      candlesCount: candles.length,
      indicators: {
        rsi: {
          value: rsi,
          period: 14,
          zone: rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : rsi >= 50 ? 'BULLISH_ZONE' : 'BEARISH_ZONE',
        },
        ema: {
          ema9: ema.ema9,
          ema21: ema.ema21,
          spread: ema.spread,
          trend: ema.trend,
          crossover: ema.crossover,
        },
        vwap: {
          vwap: vwap.vwap,
          position: vwap.position,
          deviationPercent: vwap.deviationPercent,
          upperBand: vwap.upperBand,
          lowerBand: vwap.lowerBand,
        },
        macd: {
          macdLine: macd.macdLine,
          signalLine: macd.signalLine,
          histogram: macd.histogram,
          crossover: macd.crossover,
          momentum: macd.momentum,
        },
        volume: {
          currentVolume: volume.currentVolume,
          averageVolume: volume.averageVolume,
          spikeRatio: volume.spikeRatio,
          isSpike: volume.isSpike,
          status: volume.status,
        },
      },
      confluence,
    };

    this.cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }
}

export const technicalIndicatorsService = new TechnicalIndicatorsService();
