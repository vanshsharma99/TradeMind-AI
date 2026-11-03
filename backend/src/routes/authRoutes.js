import express from 'express';
import {
  getLoginUrl,
  handleOAuthCallback,
  getAuthStatus,
  logout,
  simulateMockAuth,
} from '../controllers/authController.js';

const router = express.Router();

// Upstox OAuth 2.0 flow
router.get('/upstox/login', getLoginUrl);
router.get('/upstox/callback', handleOAuthCallback);
router.get('/upstox/status', getAuthStatus);
router.post('/upstox/logout', logout);

// Developer Sandbox / Testing mode
router.post('/upstox/mock-login', simulateMockAuth);

export default router;
