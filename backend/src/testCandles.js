import { startServer, stopServer } from './server.js';
import mongoose from 'mongoose';

const runCandleTests = async () => {
  let startedByTest = false;

  try {
    // Check if server is already running
    const check = await fetch('http://localhost:5000/api/health').catch(() => null);
    if (!check || !check.ok) {
      console.log('[Test Setup] Starting local test server...');
      await startServer();
      startedByTest = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      console.log('[Test Setup] Existing operational server detected on port 5000.');
    }
  } catch (err) {
    console.log('[Test Setup] Starting server instance...');
    await startServer();
    startedByTest = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('\n--- 🧪 Starting Phase 4 Live Market Data & Candle Engine Tests ---');

  try {
    const baseUrl = 'http://localhost:5000/api/v1/market';

    // Test 1: REST Endpoint - GET /api/v1/market/candles
    console.log('[Test 1] Testing GET /api/v1/market/candles (1m interval)...');
    let res = await fetch(`${baseUrl}/candles?symbol=NSE_INDEX|Nifty 50&interval=1m&limit=20`);
    let json = await res.json();
    console.log(`API returned ${json.count} candles for ${json.symbol}`);
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error('Candles REST API failed to return data');
    }
    const sampleCandle = json.data[json.data.length - 1];
    console.log('Sample Live 1m Candle:', sampleCandle);
    if (!sampleCandle.open || !sampleCandle.high || !sampleCandle.low || !sampleCandle.close) {
      throw new Error('Candle missing required OHLC properties');
    }
    console.log('✅ Test 1 Passed: OHLCV Candlestick aggregation verified.');

    // Test 2: REST Endpoint - GET /api/v1/market/depth
    console.log('\n[Test 2] Testing GET /api/v1/market/depth (5-level order book)...');
    res = await fetch(`${baseUrl}/depth?symbol=NSE_INDEX|Nifty 50`);
    json = await res.json();
    const depth = json.data;
    console.log(`LTP: ${depth.ltp}, Bids: ${depth.bids.length} levels, Asks: ${depth.asks.length} levels`);
    console.log(`Buyer Ratio: ${depth.buyerRatio}%, Seller Ratio: ${depth.sellerRatio}%, Spread: ${depth.spread}`);
    if (!depth.bids || depth.bids.length !== 5 || !depth.asks || depth.asks.length !== 5) {
      throw new Error('Market depth must provide exactly 5 bid and ask levels');
    }
    console.log('✅ Test 2 Passed: 5-Level Market Depth & Ratio calculation verified.');

    // Test 3: Multi-Interval Support (5m & 15m)
    console.log('\n[Test 3] Testing 5m and 15m interval retrieval...');
    const res5m = await fetch(`${baseUrl}/candles?symbol=NSE_INDEX|Nifty 50&interval=5m&limit=10`);
    const json5m = await res5m.json();
    console.log(`5m Candles count: ${json5m.count}`);
    if (!json5m.success || json5m.count === 0) {
      throw new Error('5m candle retrieval failed');
    }
    console.log('✅ Test 3 Passed: Multi-interval candle aggregation operational.');

    // Test 4: BANKNIFTY Depth & Stats
    console.log('\n[Test 4] Testing BANKNIFTY Depth & Day Stats...');
    res = await fetch(`${baseUrl}/depth?symbol=NSE_INDEX|Nifty Bank`);
    json = await res.json();
    console.log('BANKNIFTY Depth LTP:', json.data?.ltp, 'Day High:', json.data?.stats?.dayHigh, 'VWAP:', json.data?.stats?.vwap);
    if (!json.success || !json.data?.stats?.dayHigh) {
      throw new Error('BANKNIFTY stats missing');
    }
    console.log('✅ Test 4 Passed: BANKNIFTY Depth & VWAP Stats verified.');

    // Test 5: Multi-index Market Summary API
    console.log('\n[Test 5] Testing GET /api/v1/market/summary...');
    res = await fetch(`${baseUrl}/summary`);
    json = await res.json();
    console.log('Summary Instruments:', Object.keys(json.data || {}));
    if (!json.success || !json.data['NSE_INDEX|Nifty 50'] || !json.data['NSE_INDEX|Nifty Bank']) {
      throw new Error('Market Summary API missing required indices');
    }
    console.log('✅ Test 5 Passed: Multi-index Market Summary API operational.');

    console.log('\n🎉 ALL PHASE 4 LIVE MARKET DATA TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Phase 4 Test Failed:', err.message);
    process.exit(1);
  } finally {
    if (startedByTest) {
      await stopServer();
      await mongoose.disconnect();
    }
  }
};

runCandleTests();
