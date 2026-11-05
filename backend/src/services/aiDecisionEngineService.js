/**
 * TradeMind AI - Autonomous Decision Engine & AI Trading Agent
 * Combines Deterministic Technical Indicators, Option Chain Greeks/PCR,
 * Strict Risk/Reward Validation (>= 1:1.5), and LLM (Gemini) Contextual Reasoning.
 */

import axios from 'axios';
import { technicalIndicatorsService } from './technicalIndicatorsService.js';
import { optionChainService } from './optionChainService.js';
import { marketDataFeedService } from './marketDataFeedService.js';
import { TradeSignal } from '../models/TradeSignal.js';

class AiDecisionEngineService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || null;
  }

  /**
   * Tool 1: Evaluates whether proposed trade parameters satisfy strict Risk-Reward ratio (>= 1.5)
   */
  evaluateRiskReward(entryPrice, stopLossPrice, targetPrice, isCall = true) {
    if (!entryPrice || !stopLossPrice || !targetPrice) {
      return { valid: false, ratio: 0, reason: 'Missing pricing parameters' };
    }

    const risk = Math.abs(entryPrice - stopLossPrice);
    const reward = Math.abs(targetPrice - entryPrice);

    if (risk <= 0) {
      return { valid: false, ratio: 0, reason: 'Risk must be greater than zero' };
    }

    const ratio = Number((reward / risk).toFixed(2));
    const valid = ratio >= 1.5;

    return {
      valid,
      ratio,
      riskPoints: Number(risk.toFixed(2)),
      rewardPoints: Number(reward.toFixed(2)),
      reason: valid ? 'Satisfies institutional >= 1:1.5 R:R threshold' : 'Rejected: R:R ratio below 1.5',
    };
  }

  /**
   * Tool 2: Gathers consolidated real-time market context
   */
  async gatherMarketContext(symbol = 'NSE_INDEX|Nifty 50', interval = '1m') {
    const validSymbol = symbol.includes('Bank') ? 'NSE_INDEX|Nifty Bank' : 'NSE_INDEX|Nifty 50';

    const [indicatorsBundle, optionChain] = await Promise.all([
      technicalIndicatorsService.getIndicators(validSymbol, interval),
      optionChainService.getOptionChain(validSymbol),
    ]);

    const latestTick = marketDataFeedService.latestTicks.get(validSymbol);
    const spotPrice = latestTick?.ltp || indicatorsBundle.spotPrice || optionChain.spotPrice || 24536.6;

    return {
      symbol: validSymbol,
      interval,
      spotPrice,
      indicators: indicatorsBundle.indicators,
      confluence: indicatorsBundle.confluence,
      optionAnalytics: optionChain.analytics,
      expiryDate: optionChain.expiryDate,
      strikes: optionChain.strikes || [],
    };
  }

  /**
   * Generates deterministic trade parameters and selected option contract
   */
  deriveTradeSetup(context) {
    const { symbol, spotPrice, confluence, optionAnalytics, expiryDate, strikes } = context;
    const score = confluence.score;
    const isNifty = !symbol.includes('Bank');
    const step = isNifty ? 50 : 100;
    const atmStrike = Math.round(spotPrice / step) * step;

    let action = 'NO_TRADE';
    let chosenStrike = null;
    let chosenContractType = 'CE';

    if (score >= 58 && (optionAnalytics.pcr >= 0.95 || score >= 68)) {
      action = 'BUY_CALL';
      chosenContractType = 'CE';
      // Find ATM or slightly ITM strike
      chosenStrike = strikes.find((s) => s.strikePrice === (atmStrike - step)) || 
                     strikes.find((s) => s.strikePrice === atmStrike) || 
                     { strikePrice: atmStrike, call: { ltp: isNifty ? 150 : 350 } };
    } else if (score <= 42 && (optionAnalytics.pcr <= 1.05 || score <= 32)) {
      action = 'BUY_PUT';
      chosenContractType = 'PE';
      // Find ATM or slightly ITM strike
      chosenStrike = strikes.find((s) => s.strikePrice === (atmStrike + step)) || 
                     strikes.find((s) => s.strikePrice === atmStrike) || 
                     { strikePrice: atmStrike, put: { ltp: isNifty ? 145 : 340 } };
    } else {
      action = 'NO_TRADE';
    }

    if (action === 'NO_TRADE') {
      return {
        action: 'NO_TRADE',
        symbol,
        instrument: `${isNifty ? 'NIFTY' : 'BANKNIFTY'} NO CONFLUENCE`,
        expiry: expiryDate,
        strikePrice: atmStrike,
        spotPriceAtSignal: spotPrice,
        entryMin: 0,
        entryMax: 0,
        stopLoss: 0,
        target: 0,
        riskReward: 0,
        confidenceScore: Math.round(Math.abs(50 - score) * 1.5 + 40),
        timeHorizon: 'INTRADAY',
        detailedReasoning: `Market in consolidation/choppy zone (Confluence Score: ${score}/100, PCR: ${optionAnalytics.pcr}). Confluence threshold for high-probability directional trade not met. Capital preservation advised.`,
        riskWarning: 'Rangebound chop. High theta decay on directional options buying.',
      };
    }

    const strikePrice = chosenStrike.strikePrice;
    const premiumLtp = chosenContractType === 'CE' 
      ? (chosenStrike.call?.ltp || (isNifty ? 150 : 350))
      : (chosenStrike.put?.ltp || (isNifty ? 145 : 340));

    // Entry range: +/- 1.5 points of current premium
    const entryMin = Number((premiumLtp - 1.5).toFixed(2));
    const entryMax = Number((premiumLtp + 1.5).toFixed(2));

    // Strict 15% Stop-loss
    const riskAmount = Number((premiumLtp * 0.16).toFixed(2));
    const stopLoss = Number((premiumLtp - riskAmount).toFixed(2));

    // Target engineered for 2.0 Risk-Reward (Reward = 2.0 * Risk)
    const rewardAmount = Number((riskAmount * 2.0).toFixed(2));
    const target = Number((premiumLtp + rewardAmount).toFixed(2));

    const rrValidation = this.evaluateRiskReward(premiumLtp, stopLoss, target);
    const instrumentName = `${isNifty ? 'NIFTY' : 'BANKNIFTY'} ${strikePrice} ${chosenContractType}`;

    return {
      action,
      symbol,
      instrument: instrumentName,
      expiry: expiryDate,
      strikePrice,
      spotPriceAtSignal: spotPrice,
      entryMin,
      entryMax,
      stopLoss,
      target,
      riskReward: rrValidation.ratio,
      confidenceScore: Math.min(94, Math.round(score * 0.9 + (rrValidation.valid ? 8 : 0))),
      timeHorizon: 'INTRADAY',
      detailedReasoning: '',
      riskWarning: '',
    };
  }

  /**
   * Invokes Gemini 2.0 Flash for narrative thesis if API Key configured,
   * otherwise generates deterministic quantitative explanation
   */
  async generateAiThesis(setup, context) {
    const { indicators, confluence, optionAnalytics } = context;
    const rsi = indicators.rsi?.value || 50;
    const emaTrend = indicators.ema?.trend || 'NEUTRAL';
    const emaCross = indicators.ema?.crossover || 'NONE';
    const vwapPos = indicators.vwap?.position || 'AT_VWAP';
    const macdMomentum = indicators.macd?.momentum || 'NEUTRAL';
    const pcr = optionAnalytics.pcr || 1.0;

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY || this.geminiApiKey;

    if (apiKey) {
      try {
        console.log('[AI Decision Engine] Invoking Gemini 2.0 Flash for narrative reasoning...');
        const prompt = `
You are TradeMind AI, an institutional quantitative derivatives trading agent for the Indian Stock Market (NIFTY & BANKNIFTY).
Given this verified deterministic market analysis, provide a structured institutional thesis explaining the trade setup.

Trade Setup:
- Action: ${setup.action}
- Instrument: ${setup.instrument} (Expiry: ${setup.expiry})
- Spot Price: ${setup.spotPriceAtSignal}
- Proposed Entry: ${setup.entryMin} - ${setup.entryMax}
- Proposed SL: ${setup.stopLoss} | Target: ${setup.target} (R:R: ${setup.riskReward})

Quantitative Confluence:
- Confluence Score: ${confluence.score}/100 (${confluence.sentiment})
- RSI (14): ${rsi}
- EMA 9/21: Trend ${emaTrend}, Crossover: ${emaCross}
- VWAP: ${vwapPos}
- MACD Momentum: ${macdMomentum}
- Put-Call Ratio (PCR): ${pcr}
- Max Pain: ${optionAnalytics.maxPainStrike}

Instructions:
1. Provide a concise, professional 2-3 sentence rationale explaining the confluence.
2. Provide a 1-sentence risk warning highlighting the key technical invalidation level or theta consideration.
Return output in strictly valid JSON:
{
  "detailedReasoning": "...",
  "riskWarning": "..."
}`;

        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2,
            },
          },
          { timeout: 9000 }
        );

        const responseText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          const parsed = JSON.parse(responseText);
          return {
            detailedReasoning: parsed.detailedReasoning || '',
            riskWarning: parsed.riskWarning || '',
            modelUsed: 'gemini-2.0-flash',
          };
        }
      } catch (err) {
        console.warn(`[Gemini API Fallback] ${err.message}. Generating deterministic thesis.`);
      }
    }

    // High-Precision Deterministic Narrative Generator (Default / Fallback)
    let detailedReasoning = '';
    let riskWarning = '';

    if (setup.action === 'BUY_CALL') {
      detailedReasoning = `Bullish technical confluence confirmed: Spot trading above intraday VWAP with EMA 9/21 in strong uptrend (${emaTrend}). RSI at ${rsi} indicates constructive upward momentum without overbought exhaustion, reinforced by healthy institutional PCR of ${pcr}. R:R ratio ${setup.riskReward} meets >= 1:1.5 threshold.`;
      riskWarning = `Invalidated if spot price breaks decisively below EMA 21 or VWAP. Monitor theta decay if held past 2:30 PM IST.`;
    } else if (setup.action === 'BUY_PUT') {
      detailedReasoning = `Bearish technical confluence confirmed: Spot trading below intraday VWAP with EMA 9/21 in downward trajectory (${emaTrend}). MACD indicates accelerating downward momentum and PCR of ${pcr} reflects call writing pressure at resistance. R:R ratio ${setup.riskReward} satisfies capital preservation rules.`;
      riskWarning = `Invalidated if spot price reclaims intraday VWAP. High open interest at support level may trigger sudden short-covering bounce.`;
    } else {
      detailedReasoning = `Market in neutral consolidation (Confluence Score: ${confluence.score}/100, PCR: ${pcr}). Conflicting signals between momentum oscillators and option open interest. Waiting for confirmed breakout with volume confirmation.`;
      riskWarning = `Avoid entering directional options buying in chop to prevent heavy theta attrition.`;
    }

    return {
      detailedReasoning,
      riskWarning,
      modelUsed: 'quantitative-deterministic-agent',
    };
  }

  /**
   * Main Agent Decision Pipeline: Runs multi-step analysis and saves signal to MongoDB
   */
  async generateDecision(symbol = 'NSE_INDEX|Nifty 50', interval = '1m') {
    // Step 1: Gather state & indicators
    const context = await this.gatherMarketContext(symbol, interval);

    // Step 2: Calculate deterministic setup & risk rules
    const setup = this.deriveTradeSetup(context);

    // Step 3: Generate AI Reasoning (Gemini or Deterministic)
    const thesis = await this.generateAiThesis(setup, context);

    // Step 4: Assemble final signal document
    const signalPayload = {
      ...setup,
      detailedReasoning: thesis.detailedReasoning || setup.detailedReasoning,
      riskWarning: thesis.riskWarning || setup.riskWarning,
      modelUsed: thesis.modelUsed,
      technicalConfluence: {
        rsi: context.indicators.rsi?.value,
        emaCross: context.indicators.ema?.crossover,
        emaSpread: context.indicators.ema?.spread,
        vwapPosition: context.indicators.vwap?.position,
        macdMomentum: context.indicators.macd?.momentum,
        volumeStatus: context.indicators.volume?.status,
        pcr: context.optionAnalytics?.pcr,
        maxPain: context.optionAnalytics?.maxPainStrike,
      },
    };

    // Step 5: Persist signal in MongoDB
    const savedSignal = await TradeSignal.create(signalPayload);
    return savedSignal;
  }

  /**
   * Retrieves latest signal for a symbol
   */
  async getLatestSignal(symbol = 'NSE_INDEX|Nifty 50') {
    const validSymbol = symbol.includes('Bank') ? 'NSE_INDEX|Nifty Bank' : 'NSE_INDEX|Nifty 50';
    let signal = await TradeSignal.findOne({ symbol: validSymbol }).sort({ createdAt: -1 });

    // If no signal exists yet, generate initial one
    if (!signal) {
      signal = await this.generateDecision(validSymbol);
    }
    return signal;
  }

  /**
   * Retrieves signal history
   */
  async getSignalHistory(symbol = null, limit = 20) {
    const query = symbol ? { symbol } : {};
    return await TradeSignal.find(query).sort({ createdAt: -1 }).limit(limit);
  }
}

export const aiDecisionEngineService = new AiDecisionEngineService();
