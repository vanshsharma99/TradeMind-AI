import app, { stopServer } from './server.js';
import mongoose from 'mongoose';
import {
  initProtobuf,
  decodeProtobufFeed,
  encodeProtobufFeed,
  normalizeFeedTick,
} from './websocket/protobuf/protobufDecoder.js';

const runFeedTests = async () => {
  // Allow DB & server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('\n--- 🧪 Starting Phase 3 Upstox Market Data Feed V3 Tests ---');

  try {
    // Test 1: Verify Protobuf Schema Compilation
    console.log('[Test 1] Compiling Upstox MarketDataFeed.proto schema...');
    const feedType = await initProtobuf();
    if (!feedType || feedType.name !== 'FeedResponse') {
      throw new Error('Protobuf schema compilation failed');
    }
    console.log('✅ Test 1 Passed: MarketDataFeed.proto compiled successfully.');

    // Test 2: Protobuf Encode/Decode Roundtrip Test
    console.log('\n[Test 2] Testing Protobuf binary encode & decode round-trip...');
    const testPayload = {
      type: 1,
      currentTs: Date.now(),
      feeds: {
        'NSE_INDEX|Nifty 50': {
          fullFeed: {
            indexFF: {
              ltpc: {
                ltp: 24550.25,
                ltt: Date.now(),
                ltq: 50,
                cp: 24500.00,
              },
              timestamp: Date.now(),
            },
          },
        },
      },
    };

    const encodedBuffer = await encodeProtobufFeed(testPayload);
    console.log(`Encoded binary buffer size: ${encodedBuffer.length} bytes`);
    if (!Buffer.isBuffer(encodedBuffer) && !(encodedBuffer instanceof Uint8Array)) {
      throw new Error('Encoding did not return a valid buffer/Uint8Array');
    }

    const decoded = await decodeProtobufFeed(encodedBuffer);
    console.log('Decoded feed keys:', Object.keys(decoded.feeds || {}));
    if (!decoded.feeds || !decoded.feeds['NSE_INDEX|Nifty 50']) {
      throw new Error('Decoded output does not match input feed');
    }
    console.log('✅ Test 2 Passed: Binary Protobuf round-trip verified.');

    // Test 3: Normalization Logic Test
    console.log('\n[Test 3] Testing tick normalization...');
    const rawFeed = decoded.feeds['NSE_INDEX|Nifty 50'];
    const normalized = normalizeFeedTick('NSE_INDEX|Nifty 50', rawFeed);
    console.log('Normalized Tick:', normalized);

    if (normalized.ltp !== 24550.25 || normalized.change !== 50.25) {
      throw new Error(`Normalization error: expected ltp 24550.25, got ${normalized.ltp}`);
    }
    console.log('✅ Test 3 Passed: Normalized tick calculations accurate.');

    // Test 4: Market Feed REST Status API
    console.log('\n[Test 4] Querying GET /api/v1/market/feed/status...');
    const statusRes = await fetch('http://localhost:5000/api/v1/market/feed/status');
    const statusJson = await statusRes.json();
    console.log('Feed Status Response:', statusJson);

    if (!statusJson.success || !statusJson.data?.protocol) {
      throw new Error('Feed status endpoint returned unexpected response');
    }
    console.log('✅ Test 4 Passed: Feed status endpoint reporting active stream.');

    // Test 5: Verify Live / Simulated Tick Stream
    console.log('\n[Test 5] Waiting 2 seconds to verify live tick arrival...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const ticksRes = await fetch('http://localhost:5000/api/v1/market/feed/ticks');
    const ticksJson = await ticksRes.json();
    console.log('Latest Ticks Keys:', Object.keys(ticksJson.data || {}));

    if (!ticksJson.data || !ticksJson.data['NSE_INDEX|Nifty 50']) {
      throw new Error('No live ticks recorded in Market Data Feed Service');
    }
    console.log('Sample NIFTY 50 Tick:', ticksJson.data['NSE_INDEX|Nifty 50']);
    console.log('✅ Test 5 Passed: Stream actively receiving and decoding ticks.');

    console.log('\n🎉 ALL PHASE 3 MARKET DATA FEED V3 TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Phase 3 Feed Test Failed:', err.message);
    process.exit(1);
  } finally {
    await stopServer();
    await mongoose.disconnect();
  }
};

runFeedTests();
