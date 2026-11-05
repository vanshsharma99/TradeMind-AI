import axios from 'axios';
import { UpstoxAuth } from '../models/UpstoxAuth.js';
import { marketDataFeedService } from './marketDataFeedService.js';

class OptionChainService {
  constructor() {
    this.cache = new Map();
    this.cacheTtlMs = 5000; // 5-second cache for high-frequency queries
  }

  /**
   * Generates upcoming weekly expiry dates for NIFTY and BANKNIFTY
   * Fetches real live contract expiries from Upstox when authenticated
   */
  async getAvailableExpiries(symbol = 'NSE_INDEX|Nifty 50') {
    const validSymbol = symbol.includes('Bank') ? 'NSE_INDEX|Nifty Bank' : 'NSE_INDEX|Nifty 50';

    try {
      const activeAuth = await UpstoxAuth.getActiveAuth();
      if (activeAuth && !activeAuth.isSimulated && activeAuth.accessToken) {
        const cacheKey = `expiries_${validSymbol}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 3600000) {
          return cached.data;
        }

        const res = await axios.get('https://api.upstox.com/v2/option/contract', {
          params: { instrument_key: validSymbol },
          headers: { Authorization: `Bearer ${activeAuth.accessToken}` },
          timeout: 8000,
        });

        if (res.data?.data && Array.isArray(res.data.data)) {
          const uniqueExpiries = [...new Set(res.data.data.map((c) => c.expiry))].sort();
          if (uniqueExpiries.length > 0) {
            const nextExpiries = uniqueExpiries.slice(0, 5);
            this.cache.set(cacheKey, { timestamp: Date.now(), data: nextExpiries });
            return nextExpiries;
          }
        }
      }
    } catch (err) {
      console.warn(`[Option Expiries Notice] ${err.message}. Using calendar fallback.`);
    }

    const expiries = [];
    const now = new Date();
    // In India: NIFTY options expire on Thursdays, BANKNIFTY options expire on Wednesdays
    const targetDay = validSymbol.includes('Bank') ? 3 : 4; // 3 = Wed, 4 = Thu

    let cursor = new Date(now);

    // Collect next 4 weekly expiries
    while (expiries.length < 4) {
      if (cursor.getDay() === targetDay && cursor.getTime() > now.getTime() - 24 * 60 * 60 * 1000) {
        const year = cursor.getFullYear();
        const month = String(cursor.getMonth() + 1).padStart(2, '0');
        const day = String(cursor.getDate()).padStart(2, '0');
        expiries.push(`${year}-${month}-${day}`);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return expiries;
  }

  /**
   * Calculates Black-Scholes Greeks approximation and implied volatility
   */
  calculateGreeks(spot, strike, isCall, timeToExpiryDays = 3, iv = 13.5) {
    const t = Math.max(0.01, timeToExpiryDays / 365);
    const sigma = iv / 100;
    const moneyness = Math.log(spot / strike);
    const d1 = (moneyness + 0.5 * sigma * sigma * t) / (sigma * Math.sqrt(t));

    // Standard normal CDF approximation
    const normalCdf = (x) => {
      const b1 = 0.319381530;
      const b2 = -0.356563782;
      const b3 = 1.781477937;
      const b4 = -1.821255978;
      const b5 = 1.330274429;
      const p = 0.2316419;
      const c = 0.39894228;
      if (x >= 0.0) {
        const k = 1.0 / (1.0 + p * x);
        return 1.0 - c * Math.exp(-x * x / 2.0) * k * (k * (k * (k * (k * b5 + b4) + b3) + b2) + b1);
      } else {
        const k = 1.0 / (1.0 - p * x);
        return c * Math.exp(-x * x / 2.0) * k * (k * (k * (k * (k * b5 + b4) + b3) + b2) + b1);
      }
    };

    const delta = isCall ? normalCdf(d1) : normalCdf(d1) - 1.0;
    const gamma = (Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI)) / (spot * sigma * Math.sqrt(t));
    const vega = (spot * Math.sqrt(t) * (Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI))) / 100;
    const theta = (-(spot * sigma * Math.exp(-0.5 * d1 * d1)) / (2 * Math.sqrt(2 * Math.PI) * Math.sqrt(t))) / 365;

    return {
      delta: Number(delta.toFixed(3)),
      gamma: Number(gamma.toFixed(5)),
      theta: Number(theta.toFixed(2)),
      vega: Number(vega.toFixed(2)),
      iv: Number(iv.toFixed(1)),
    };
  }

  /**
   * Generates authentic Option Chain matrix around current spot price
   */
  generateSimulatedOptionChain(symbol, expiryDate, spotPrice) {
    const isBankNifty = symbol.toLowerCase().includes('bank');
    const strikeStep = isBankNifty ? 100 : 50;
    const atmStrike = Math.round(spotPrice / strikeStep) * strikeStep;

    const strikes = [];
    const numStrikesEachSide = 10;

    for (let i = -numStrikesEachSide; i <= numStrikesEachSide; i++) {
      const strike = atmStrike + i * strikeStep;
      const diff = spotPrice - strike;

      // Realistic Call pricing
      const callIntrinsic = Math.max(0, diff);
      const callTimeValue = Math.max(8, (numStrikesEachSide - Math.abs(i)) * (isBankNifty ? 28 : 12) + (Math.random() * 4));
      const callLtp = Number((callIntrinsic + callTimeValue).toFixed(2));
      const callOi = Math.floor(1200000 + (Math.sin(i * 0.3) + 1.2) * 850000 + Math.random() * 100000);
      const callOiChg = Number(((Math.random() - 0.45) * 15).toFixed(2));
      const callGreeks = this.calculateGreeks(spotPrice, strike, true, 3, 13.5 + Math.abs(i) * 0.2);

      // Realistic Put pricing
      const putIntrinsic = Math.max(0, -diff);
      const putTimeValue = Math.max(8, (numStrikesEachSide - Math.abs(i)) * (isBankNifty ? 28 : 12) + (Math.random() * 4));
      const putLtp = Number((putIntrinsic + putTimeValue).toFixed(2));
      const putOi = Math.floor(1350000 + (Math.cos(i * 0.3) + 1.2) * 920000 + Math.random() * 100000);
      const putOiChg = Number(((Math.random() - 0.45) * 15).toFixed(2));
      const putGreeks = this.calculateGreeks(spotPrice, strike, false, 3, 14.1 + Math.abs(i) * 0.2);

      strikes.push({
        strikePrice: strike,
        isAtm: strike === atmStrike,
        call: {
          ltp: callLtp,
          bid: Number((callLtp - 0.15).toFixed(2)),
          ask: Number((callLtp + 0.15).toFixed(2)),
          volume: Math.floor(callOi * 0.4),
          oi: callOi,
          oiChangePercent: callOiChg,
          greeks: callGreeks,
        },
        put: {
          ltp: putLtp,
          bid: Number((putLtp - 0.15).toFixed(2)),
          ask: Number((putLtp + 0.15).toFixed(2)),
          volume: Math.floor(putOi * 0.4),
          oi: putOi,
          oiChangePercent: putOiChg,
          greeks: putGreeks,
        },
      });
    }

    return strikes;
  }

  /**
   * Computes Put-Call Ratio (PCR), Max Pain, Support & Resistance strikes
   */
  calculateAnalytics(strikes, spotPrice) {
    let totalCallOi = 0;
    let totalPutOi = 0;
    let totalCallVolume = 0;
    let totalPutVolume = 0;

    let maxCallOi = 0;
    let resistanceStrike = 0;

    let maxPutOi = 0;
    let supportStrike = 0;

    strikes.forEach((s) => {
      totalCallOi += s.call.oi;
      totalPutOi += s.put.oi;
      totalCallVolume += s.call.volume;
      totalPutVolume += s.put.volume;

      if (s.call.oi > maxCallOi) {
        maxCallOi = s.call.oi;
        resistanceStrike = s.strikePrice;
      }

      if (s.put.oi > maxPutOi) {
        maxPutOi = s.put.oi;
        supportStrike = s.strikePrice;
      }
    });

    const pcr = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0;
    const volumePcr = totalCallVolume > 0 ? Number((totalPutVolume / totalCallVolume).toFixed(2)) : 1.0;

    // Max Pain Calculation (Strike where total option intrinsic payout is minimized)
    let minPainValue = Infinity;
    let maxPainStrike = strikes[Math.floor(strikes.length / 2)]?.strikePrice || spotPrice;

    strikes.forEach((testStrike) => {
      let pain = 0;
      strikes.forEach((s) => {
        const callLoss = Math.max(0, testStrike.strikePrice - s.strikePrice) * s.call.oi;
        const putLoss = Math.max(0, s.strikePrice - testStrike.strikePrice) * s.put.oi;
        pain += callLoss + putLoss;
      });

      if (pain < minPainValue) {
        minPainValue = pain;
        maxPainStrike = testStrike.strikePrice;
      }
    });

    let marketSentiment = 'NEUTRAL';
    if (pcr >= 1.2) {
      marketSentiment = 'BULLISH';
    } else if (pcr <= 0.8) {
      marketSentiment = 'BEARISH';
    } else if (pcr > 1.0) {
      marketSentiment = 'MILDLY_BULLISH';
    } else {
      marketSentiment = 'MILDLY_BEARISH';
    }

    return {
      pcr,
      volumePcr,
      marketSentiment,
      totalCallOi,
      totalPutOi,
      maxPainStrike,
      supportStrike,
      resistanceStrike,
      spotPrice,
    };
  }

  /**
   * Retrieves full option chain with analytics (Dual-Mode: Live Upstox API or Simulation)
   */
  async getOptionChain(symbol = 'NSE_INDEX|Nifty 50', expiryDate = null) {
    const validSymbol = symbol.includes('Bank') ? 'NSE_INDEX|Nifty Bank' : 'NSE_INDEX|Nifty 50';
    const expiries = await this.getAvailableExpiries(validSymbol);
    const targetExpiry = expiryDate && expiries.includes(expiryDate) ? expiryDate : expiries[0];

    // Get current spot price from live feed service
    const latestTick = marketDataFeedService.latestTicks.get(validSymbol);
    let spotPrice = latestTick?.ltp || (validSymbol.includes('Bank') ? 52180.25 : 24530.50);

    const cacheKey = `${validSymbol}_${targetExpiry}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    try {
      const activeAuth = await UpstoxAuth.getActiveAuth();

      // If active non-simulated broker token is connected, call live Upstox Option Chain API
      if (activeAuth && !activeAuth.isSimulated && activeAuth.accessToken) {
        console.log(`[Option Chain] Querying live Upstox Option Chain API for ${validSymbol} (${targetExpiry})...`);
        const response = await axios.get('https://api.upstox.com/v2/option/chain', {
          params: {
            instrument_key: validSymbol,
            expiry_date: targetExpiry,
          },
          headers: {
            Authorization: `Bearer ${activeAuth.accessToken}`,
            Accept: 'application/json',
          },
          timeout: 8000,
        });

        if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Use real live underlying spot price reported by Upstox
          if (response.data.data[0]?.underlying_spot_price) {
            spotPrice = response.data.data[0].underlying_spot_price;
          }

          // Normalize Upstox API response
          const liveStrikes = response.data.data.map((item) => ({
            strikePrice: item.strike_price,
            call: {
              ltp: item.call_options?.market_data?.ltp || 0,
              bid: item.call_options?.market_data?.bid_price || 0,
              ask: item.call_options?.market_data?.ask_price || 0,
              volume: item.call_options?.market_data?.volume || 0,
              oi: item.call_options?.market_data?.oi || 0,
              greeks: item.call_options?.option_greeks || {},
            },
            put: {
              ltp: item.put_options?.market_data?.ltp || 0,
              bid: item.put_options?.market_data?.bid_price || 0,
              ask: item.put_options?.market_data?.ask_price || 0,
              volume: item.put_options?.market_data?.volume || 0,
              oi: item.put_options?.market_data?.oi || 0,
              greeks: item.put_options?.option_greeks || {},
            },
          }));

          // Comprehensive market-wide analytics across all active strikes
          const analytics = this.calculateAnalytics(liveStrikes, spotPrice);

          // Center visible strikes around ATM for optimal UI responsiveness
          const step = validSymbol.includes('Bank') ? 100 : 50;
          const atmStrike = Math.round(spotPrice / step) * step;
          const centeredStrikes = liveStrikes
            .filter((s) => Math.abs(s.strikePrice - atmStrike) <= 12 * step)
            .sort((a, b) => a.strikePrice - b.strikePrice);

          const displayStrikes = centeredStrikes.length >= 10 ? centeredStrikes : liveStrikes.slice(0, 31);

          const result = {
            symbol: validSymbol,
            expiryDate: targetExpiry,
            availableExpiries: expiries,
            spotPrice,
            isSimulated: false,
            analytics,
            strikes: displayStrikes,
          };

          this.cache.set(cacheKey, { timestamp: Date.now(), data: result });
          return result;
        }
      }
    } catch (err) {
      console.warn(`[Option Chain API Notice] ${err.response?.data?.message || err.message}. Serving authentic simulated chain.`);
    }

    // Default / Sandbox Mode
    const simulatedStrikes = this.generateSimulatedOptionChain(validSymbol, targetExpiry, spotPrice);
    const analytics = this.calculateAnalytics(simulatedStrikes, spotPrice);

    const result = {
      symbol: validSymbol,
      expiryDate: targetExpiry,
      availableExpiries: expiries,
      spotPrice,
      isSimulated: true,
      analytics,
      strikes: simulatedStrikes,
    };

    this.cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }
}

export const optionChainService = new OptionChainService();
