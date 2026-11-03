import { UpstoxAuth } from '../models/UpstoxAuth.js';
import {
  generateAuthorizationUrl,
  exchangeCodeForAccessToken,
  calculateUpstoxExpiry,
  revokeUpstoxToken,
} from '../services/upstoxAuthService.js';
import { config } from '../config/env.js';

/**
 * GET /api/v1/auth/upstox/login
 * Returns the Upstox OAuth 2.0 Authorization URL
 */
export const getLoginUrl = (req, res) => {
  try {
    const apiKey = config.upstox.apiKey || process.env.UPSTOX_API_KEY;
    const apiSecret = config.upstox.apiSecret || process.env.UPSTOX_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: 'Upstox API credentials not configured in backend/.env',
        loginUrl: null,
      });
    }

    const state = `tm_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const loginUrl = generateAuthorizationUrl(state);

    return res.status(200).json({
      success: true,
      configured: true,
      loginUrl,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET /api/v1/auth/upstox/callback
 * Handles OAuth 2.0 redirect from Upstox with temporary auth code
 */
export const handleOAuthCallback = async (req, res) => {
  const { code, error, error_description } = req.query;

  // Handle user cancellation or OAuth error
  if (error || !code) {
    console.error(`[OAuth Callback Error] ${error}: ${error_description}`);
    return res.redirect(
      `${config.clientUrl}?auth_error=${encodeURIComponent(error_description || error || 'Authorization failed')}`
    );
  }

  try {
    console.log('[OAuth Callback] Received authorization code. Exchanging for access token...');
    const tokenResponse = await exchangeCodeForAccessToken(code);

    const accessToken = tokenResponse.access_token;
    const userId = tokenResponse.user_id || tokenResponse.ucc || 'UPSTOX_USER';
    const userName = tokenResponse.user_name || 'Upstox Trader';
    const email = tokenResponse.email || '';
    const expiresAt = calculateUpstoxExpiry();

    // Persist securely in MongoDB
    await UpstoxAuth.saveAuth({
      userId,
      userName,
      email,
      accessToken,
      expiresAt,
      isSimulated: false,
      metadata: {
        tokenType: tokenResponse.token_type || 'Bearer',
        scope: tokenResponse.scope,
      },
    });

    console.log(`[OAuth Success] Access token stored for user: ${userId} (${userName})`);
    return res.redirect(`${config.clientUrl}?auth=success&user=${encodeURIComponent(userName)}`);
  } catch (err) {
    const errorDetails =
      err.response?.data?.errors?.[0]?.message ||
      err.response?.data?.message ||
      err.message ||
      'Failed to exchange authorization code for access token';
    console.error(`[OAuth Token Exchange Error]`, errorDetails);
    if (err.response?.data) {
      console.error('[OAuth Upstox Response Body]', JSON.stringify(err.response.data));
    }
    return res.redirect(
      `${config.clientUrl}?auth_error=${encodeURIComponent(errorDetails)}`
    );
  }
};

/**
 * GET /api/v1/auth/upstox/status
 * Returns sanitized connection status (Never exposes raw access token or secret)
 */
export const getAuthStatus = async (req, res) => {
  try {
    const apiKey = config.upstox.apiKey || process.env.UPSTOX_API_KEY;
    const apiSecret = config.upstox.apiSecret || process.env.UPSTOX_API_SECRET;
    const isConfigured = Boolean(apiKey && apiSecret);
    const activeAuth = await UpstoxAuth.getActiveAuth();

    if (!activeAuth) {
      return res.status(200).json({
        success: true,
        connected: false,
        configured: isConfigured,
        session: null,
      });
    }

    const remainingMs = Math.max(0, new Date(activeAuth.expiresAt).getTime() - Date.now());
    const remainingHours = (remainingMs / (1000 * 60 * 60)).toFixed(1);

    return res.status(200).json({
      success: true,
      connected: true,
      configured: isConfigured,
      session: {
        userId: activeAuth.userId,
        userName: activeAuth.userName,
        email: activeAuth.email,
        expiresAt: activeAuth.expiresAt,
        remainingHours: Number(remainingHours),
        isSimulated: activeAuth.isSimulated,
        lastLoginAt: activeAuth.lastLoginAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /api/v1/auth/upstox/logout
 * Revokes current active Upstox session
 */
export const logout = async (req, res) => {
  try {
    const activeAuth = await UpstoxAuth.findOne({ isActive: true });

    if (activeAuth) {
      // If not simulated, attempt remote revocation
      if (!activeAuth.isSimulated && activeAuth.accessToken) {
        await revokeUpstoxToken(activeAuth.accessToken);
      }

      activeAuth.isActive = false;
      await activeAuth.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Broker session terminated successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /api/v1/auth/upstox/mock-login
 * For testing Phase 2 and downstream simulation when live broker keys are not yet provided
 */
export const simulateMockAuth = async (req, res) => {
  try {
    const expiresAt = calculateUpstoxExpiry();

    const mockAuth = await UpstoxAuth.saveAuth({
      userId: 'MOCK_TRADER_99',
      userName: 'Simulated Paper Trader',
      email: 'paper_trader@trademind.local',
      accessToken: 'simulated_upstox_dev_token_sandbox',
      expiresAt,
      isSimulated: true,
      metadata: { mode: 'test_sandbox' },
    });

    return res.status(200).json({
      success: true,
      message: 'Simulated Upstox test session initiated successfully.',
      session: {
        userId: mockAuth.userId,
        userName: mockAuth.userName,
        expiresAt: mockAuth.expiresAt,
        isSimulated: true,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
