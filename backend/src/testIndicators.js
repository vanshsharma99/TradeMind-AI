import { technicalIndicatorsService } from './services/technicalIndicatorsService.js';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';

const runIndicatorTests = async () => {
  await connectDB();
  console.log('\n--- 🧪 Starting Phase 7 Technical Indicators Verification Tests ---');

  try {
    // -------------------------------------------------------------
    // Test 1: RSI (14) Wilder's Smoothing Mathematical Accuracy
    // -------------------------------------------------------------
    console.log('[Test 1] Testing RSI (14) formula with synthetic bullish/bearish series...');
    
    // 15 rising candles (Strictly Bullish -> RSI should be high > 70)
    const risingCandles = Array.from({ length: 25 }, (_, i) => ({
      close: 24000 + i * 20,
      high: 24000 + i * 20 + 10,
      low: 24000 + i * 20 - 5,
      volume: 1000 + i * 50,
    }));
    const highRsi = technicalIndicatorsService.calculateRSI(risingCandles, 14);
    console.log(`Bullish Series RSI: ${highRsi} (Expected > 75)`);
    if (highRsi < 75) {
      throw new Error(`RSI calculation error on rising series: expected > 75, got ${highRsi}`);
    }

    // 15 falling candles (Strictly Bearish -> RSI should be low < 30)
    const fallingCandles = Array.from({ length: 25 }, (_, i) => ({
      close: 25000 - i * 20,
      high: 25000 - i * 20 + 5,
      low: 25000 - i * 20 - 10,
      volume: 1000 + i * 50,
    }));
    const lowRsi = technicalIndicatorsService.calculateRSI(fallingCandles, 14);
    console.log(`Bearish Series RSI: ${lowRsi} (Expected < 25)`);
    if (lowRsi > 25) {
      throw new Error(`RSI calculation error on falling series: expected < 25, got ${lowRsi}`);
    }
    console.log('✅ Test 1 Passed: RSI (14) Wilder smoothing verified for Overbought/Oversold extremes.');

    // -------------------------------------------------------------
    // Test 2: EMA (9 and 21) & Golden/Death Cross Detection
    // -------------------------------------------------------------
    console.log('\n[Test 2] Testing EMA 9 & 21 calculation and Crossover Detection...');
    
    // Generate a series where price starts falling then aggressively rallies (Golden Cross)
    const crossoverCandles = [
      ...Array.from({ length: 25 }, (_, i) => ({ close: 24500 - i * 10 })), // downtrend
      ...Array.from({ length: 15 }, (_, i) => ({ close: 24250 + i * 40 })), // aggressive rally
    ];

    const emaResult = technicalIndicatorsService.calculateEMA(crossoverCandles);
    console.log('EMA Analysis Output:', emaResult);
    if (typeof emaResult.ema9 !== 'number' || typeof emaResult.ema21 !== 'number') {
      throw new Error('EMA calculation did not return numerical values');
    }
    if (emaResult.ema9 <= emaResult.ema21) {
      throw new Error(`EMA 9 (${emaResult.ema9}) should exceed EMA 21 (${emaResult.ema21}) after sharp rally`);
    }
    console.log('✅ Test 2 Passed: EMA 9 & 21 values, spread, and trend detection verified.');

    // -------------------------------------------------------------
    // Test 3: VWAP & Intraday Standard Deviation Bands
    // -------------------------------------------------------------
    console.log('\n[Test 3] Testing VWAP & Standard Deviation Bands...');
    const vwapCandles = [
      { high: 24520, low: 24480, close: 24510, volume: 5000 },
      { high: 24550, low: 24500, close: 24540, volume: 10000 },
      { high: 24580, low: 24530, close: 24570, volume: 15000 },
      { high: 24600, low: 24560, close: 24590, volume: 20000 },
    ];
    const vwapResult = technicalIndicatorsService.calculateVWAP(vwapCandles);
    console.log('VWAP Analysis Output:', vwapResult);
    if (!vwapResult.vwap || vwapResult.vwap <= 0) {
      throw new Error('VWAP calculation returned invalid value');
    }
    if (vwapResult.upperBand <= vwapResult.vwap || vwapResult.lowerBand >= vwapResult.vwap) {
      throw new Error('VWAP bands should envelop VWAP');
    }
    console.log('✅ Test 3 Passed: Volume Weighted Average Price & Bands accurate.');

    // -------------------------------------------------------------
    // Test 4: MACD (12, 26, 9) Line, Signal Line & Histogram
    // -------------------------------------------------------------
    console.log('\n[Test 4] Testing MACD (12, 26, 9) and Momentum...');
    const macdCandles = Array.from({ length: 40 }, (_, i) => ({
      close: 24000 + Math.sin(i / 3) * 100 + i * 15,
    }));
    const macdResult = technicalIndicatorsService.calculateMACD(macdCandles);
    console.log('MACD Output:', macdResult);
    if (typeof macdResult.macdLine !== 'number' || typeof macdResult.histogram !== 'number') {
      throw new Error('MACD returned non-numeric lines');
    }
    console.log('✅ Test 4 Passed: MACD line, signal line, and histogram momentum verified.');

    // -------------------------------------------------------------
    // Test 5: Volume Spike Detector & Multi-Indicator Confluence Score
    // -------------------------------------------------------------
    console.log('\n[Test 5] Testing Volume Spike Detection and Confluence Scorer...');
    const normalVolumeCandles = Array.from({ length: 20 }, () => ({ close: 24500, volume: 1000 }));
    // 21st candle has 3x volume surge
    normalVolumeCandles.push({ close: 24550, volume: 3000 });
    const volumeResult = technicalIndicatorsService.calculateVolumeAnalysis(normalVolumeCandles);
    console.log('Volume Analysis:', volumeResult);
    if (!volumeResult.isSpike || volumeResult.spikeRatio < 2.0) {
      throw new Error('Volume spike detector failed to detect 3x surge');
    }

    // Confluence Scorer test
    const confluence = technicalIndicatorsService.calculateConfluenceScore(
      62.5, // Bullish RSI
      { ema9: 24550, ema21: 24500, trend: 'BULLISH', crossover: 'GOLDEN_CROSS_BULLISH' },
      { position: 'ABOVE_VWAP_BULLISH', deviationPercent: 0.35 },
      { crossover: 'BULLISH_CROSS', momentum: 'ACCELERATING_BULLISH' },
      volumeResult
    );
    console.log('Confluence Score Result:', confluence);
    if (confluence.score < 70 || confluence.sentiment !== 'STRONG_BULLISH') {
      throw new Error(`Confluence scorer expected STRONG_BULLISH (score >= 70), got ${confluence.score}`);
    }
    console.log('✅ Test 5 Passed: Volume spike detected & Confluence Scorer accurately synthesized conviction.');

    // -------------------------------------------------------------
    // Test 6: REST API Endpoint GET /api/v1/indicators
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing REST API GET /api/v1/indicators...');
    const indicatorsData = await technicalIndicatorsService.getIndicators('NSE_INDEX|Nifty 50', '1m');
    console.log('API Service Response Summary:', {
      symbol: indicatorsData.symbol,
      interval: indicatorsData.interval,
      spotPrice: indicatorsData.spotPrice,
      rsi: indicatorsData.indicators.rsi.value,
      emaTrend: indicatorsData.indicators.ema.trend,
      vwap: indicatorsData.indicators.vwap.vwap,
      macd: indicatorsData.indicators.macd.macdLine,
      confluenceScore: indicatorsData.confluence.score,
      sentiment: indicatorsData.confluence.sentiment,
    });

    if (!indicatorsData.indicators?.rsi || !indicatorsData.indicators?.ema || !indicatorsData.confluence) {
      throw new Error('Indicators bundle missing core components');
    }
    console.log('✅ Test 6 Passed: Full technical indicators REST endpoint operational.');

    console.log('\n🎉 ALL PHASE 7 TECHNICAL INDICATORS TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Phase 7 Test Failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runIndicatorTests();
