import app, { stopServer } from './server.js';
import mongoose from 'mongoose';

const runAuthTests = async () => {
  // Allow DB connection to establish
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('\n--- 🧪 Starting Phase 2 Upstox Auth Verification Tests ---');

  try {
    const baseUrl = 'http://localhost:5000/api/v1/auth';

    // Test 1: Check initial status
    console.log('[Test 1] Testing initial auth status (expecting disconnected)...');
    let res = await fetch(`${baseUrl}/upstox/status`);
    let json = await res.json();
    console.log('Status Response:', json);
    if (!json.success || json.connected) {
      throw new Error('Initial status should be connected: false');
    }
    console.log('✅ Test 1 Passed: Initial status correctly reports disconnected.');

    // Test 2: Check login URL endpoint
    console.log('\n[Test 2] Testing login URL endpoint...');
    res = await fetch(`${baseUrl}/upstox/login`);
    json = await res.json();
    console.log('Login Endpoint Response:', json);
    if (!json.success && json.configured !== false) {
      throw new Error('Login endpoint returned unexpected structure');
    }
    console.log('✅ Test 2 Passed: Login endpoint validates configuration.');

    // Test 3: Test simulated session login
    console.log('\n[Test 3] Testing simulated session login (Sandbox)...');
    res = await fetch(`${baseUrl}/upstox/mock-login`, { method: 'POST' });
    json = await res.json();
    console.log('Mock Login Response:', json);
    if (!json.success || !json.session) {
      throw new Error('Mock login failed to create session');
    }
    console.log('✅ Test 3 Passed: Session initiated successfully.');

    // Test 4: Verify status endpoint returns active session without leaking token
    console.log('\n[Test 4] Testing auth status with active session...');
    res = await fetch(`${baseUrl}/upstox/status`);
    json = await res.json();
    console.log('Active Status Response:', json);
    if (!json.connected || !json.session) {
      throw new Error('Status should report connected: true');
    }
    if (json.session.accessToken || json.session.apiSecret) {
      throw new Error('SECURITY VIOLATION: Access token or secret exposed in API response!');
    }
    console.log('✅ Test 4 Passed: Status verified active, tokens securely masked.');

    // Test 5: Test logout
    console.log('\n[Test 5] Testing logout / session termination...');
    res = await fetch(`${baseUrl}/upstox/logout`, { method: 'POST' });
    json = await res.json();
    console.log('Logout Response:', json);
    if (!json.success) {
      throw new Error('Logout failed');
    }

    // Verify status returns disconnected
    res = await fetch(`${baseUrl}/upstox/status`);
    json = await res.json();
    if (json.connected) {
      throw new Error('Status should be disconnected after logout');
    }
    console.log('✅ Test 5 Passed: Session cleanly terminated.');

    console.log('\n🎉 ALL PHASE 2 BACKEND AUTH TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Phase 2 Auth Test Failed:', err.message);
    process.exit(1);
  } finally {
    await stopServer();
    await mongoose.disconnect();
  }
};

runAuthTests();
