import app from './server.js';
import mongoose from 'mongoose';

const test = async () => {
  // Give the server a moment to connect to DB
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('[Test Result] Status Code:', response.status);
    console.log('[Test Result] Response Data:\n', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.success && data.data.status === 'operational') {
      console.log('✅ Backend Health Check Passed Successfully!');
    } else {
      console.error('❌ Health check returned unexpected response');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Health check request failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

test();
