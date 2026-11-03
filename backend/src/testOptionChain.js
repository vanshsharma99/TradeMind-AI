import { startServer, stopServer } from './server.js';
import mongoose from 'mongoose';
import { optionChainService } from './services/optionChainService.js';

const runOptionChainTests = async () => {
  let startedByTest = false;

  try {
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

  console.log('\n--- 🧪 Starting Phase 5 Option Chain Engine Tests ---');

  try {
    const baseUrl = 'http://localhost:5000/api/v1/options';

    // Test 1: Available Expiries
    console.log('[Test 1] Testing expiry dates generator...');
    const expiries = optionChainService.getAvailableExpiries('NSE_INDEX|Nifty 50');
    console.log('Available Expiries for NIFTY:', expiries);
    if (!Array.isArray(expiries) || expiries.length < 2) {
      throw new Error('Failed to generate weekly option expiries');
    }
    console.log('✅ Test 1 Passed: Option expiry dates calculation verified.');

    // Test 2: Full Option Chain & Greeks Generation
    console.log('\n[Test 2] Querying Option Chain with Black-Scholes Greeks & OI...');
    const chain = await optionChainService.getOptionChain('NSE_INDEX|Nifty 50', expiries[0]);
    console.log(`Strikes generated: ${chain.strikes.length}, Spot Price: ${chain.spotPrice}`);
    if (!chain.strikes || chain.strikes.length === 0) {
      throw new Error('Option chain did not return strike contracts');
    }

    const sampleStrike = chain.strikes[Math.floor(chain.strikes.length / 2)];
    console.log(`Sample Strike [${sampleStrike.strikePrice}]:`, {
      callLtp: sampleStrike.call.ltp,
      callDelta: sampleStrike.call.greeks?.delta,
      callOi: sampleStrike.call.oi,
      putLtp: sampleStrike.put.ltp,
      putDelta: sampleStrike.put.greeks?.delta,
      putOi: sampleStrike.put.oi,
    });

    if (!sampleStrike.call.ltp || !sampleStrike.put.ltp || sampleStrike.call.greeks.delta === undefined) {
      throw new Error('Strike contracts missing required Greeks or pricing data');
    }
    console.log('✅ Test 2 Passed: Option Chain pricing & Greeks computation verified.');

    // Test 3: Quantitative Analytics (PCR & Max Pain)
    console.log('\n[Test 3] Verifying PCR, Max Pain, and Support/Resistance Analytics...');
    const analytics = chain.analytics;
    console.log('Option Chain Analytics:', {
      pcr: analytics.pcr,
      sentiment: analytics.marketSentiment,
      maxPain: analytics.maxPainStrike,
      support: analytics.supportStrike,
      resistance: analytics.resistanceStrike,
      totalPutOi: analytics.totalPutOi.toLocaleString(),
      totalCallOi: analytics.totalCallOi.toLocaleString(),
    });

    if (analytics.pcr <= 0 || !analytics.maxPainStrike || !analytics.supportStrike || !analytics.resistanceStrike) {
      throw new Error('Analytics calculation produced invalid metrics');
    }
    console.log('✅ Test 3 Passed: PCR and Max Pain algorithm verified.');

    // Test 4: REST API - GET /api/v1/options/chain
    console.log('\n[Test 4] Testing GET /api/v1/options/chain endpoint...');
    let res = await fetch(`${baseUrl}/chain?symbol=NSE_INDEX|Nifty 50`);
    let json = await res.json();
    if (!json.success || !json.data?.strikes || json.data.strikes.length === 0) {
      throw new Error('Option Chain REST endpoint returned invalid structure');
    }
    console.log(`API returned chain for ${json.data.symbol} with ${json.data.strikes.length} strikes`);
    console.log('✅ Test 4 Passed: Option Chain REST API operational.');

    // Test 5: REST API - GET /api/v1/options/analytics
    console.log('\n[Test 5] Testing GET /api/v1/options/analytics endpoint...');
    res = await fetch(`${baseUrl}/analytics?symbol=NSE_INDEX|Nifty 50`);
    json = await res.json();
    if (!json.success || !json.data?.pcr || !json.data?.maxPainStrike) {
      throw new Error('Option Analytics REST endpoint returned invalid structure');
    }
    console.log('Analytics Response PCR:', json.data.pcr, 'Sentiment:', json.data.marketSentiment);
    console.log('✅ Test 5 Passed: Option Analytics REST API operational.');

    console.log('\n🎉 ALL PHASE 5 OPTION CHAIN TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Phase 5 Test Failed:', err.message);
    process.exit(1);
  } finally {
    if (startedByTest) {
      await stopServer();
      await mongoose.disconnect();
    }
  }
};

runOptionChainTests();
