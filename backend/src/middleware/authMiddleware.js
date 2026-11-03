import { UpstoxAuth } from '../models/UpstoxAuth.js';

/**
 * Middleware to ensure a valid, active Upstox access token exists in DB
 */
export const requireUpstoxAuth = async (req, res, next) => {
  try {
    const activeAuth = await UpstoxAuth.getActiveAuth();

    if (!activeAuth) {
      return res.status(401).json({
        success: false,
        code: 'UPSTOX_AUTH_REQUIRED',
        message: 'No active Upstox broker session found. Please complete Upstox OAuth login.',
      });
    }

    // Attach active session and token to request object for downstream controllers
    req.upstoxAuth = activeAuth;
    req.upstoxToken = activeAuth.accessToken;

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Authentication check failed: ${err.message}`,
    });
  }
};
