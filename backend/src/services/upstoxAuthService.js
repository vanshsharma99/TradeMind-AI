import axios from 'axios';
import { config } from '../config/env.js';

const UPSTOX_BASE_URL = 'https://api.upstox.com/v2';

/**
 * Calculates Upstox token expiry time.
 * Upstox tokens remain valid until ~03:30 AM IST the next calendar day.
 */
export const calculateUpstoxExpiry = () => {
  const now = new Date();
  // 03:30 AM IST = 22:00 UTC (previous day)
  // Create candidate expiry for tomorrow at 03:30 AM IST (or today if current IST time < 03:30 AM)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);

  const istExpiry = new Date(istNow);
  istExpiry.setUTCHours(3, 30, 0, 0);

  // If current IST time is already past 3:30 AM, expiry is tomorrow at 3:30 AM IST
  if (istNow.getTime() >= istExpiry.getTime()) {
    istExpiry.setUTCDate(istExpiry.getUTCDate() + 1);
  }

  // Convert back to UTC date
  return new Date(istExpiry.getTime() - istOffsetMs);
};

/**
 * Generates the official Upstox OAuth 2.0 Login URL
 */
export const generateAuthorizationUrl = (state = 'trademind_oauth') => {
  const apiKey = config.upstox.apiKey || process.env.UPSTOX_API_KEY;
  const redirectUri = config.upstox.redirectUri || process.env.UPSTOX_REDIRECT_URI;

  if (!apiKey) {
    throw new Error('UPSTOX_API_KEY is not configured in backend environment variables.');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: apiKey,
    redirect_uri: redirectUri,
    state,
  });

  return `${UPSTOX_BASE_URL}/login/authorization/dialog?${params.toString()}`;
};

/**
 * Exchanges the temporary authorization code for an Upstox access token
 */
export const exchangeCodeForAccessToken = async (code) => {
  const apiKey = config.upstox.apiKey || process.env.UPSTOX_API_KEY;
  const apiSecret = config.upstox.apiSecret || process.env.UPSTOX_API_SECRET;
  const redirectUri = config.upstox.redirectUri || process.env.UPSTOX_REDIRECT_URI;

  if (!apiKey || !apiSecret) {
    throw new Error('UPSTOX_API_KEY or UPSTOX_API_SECRET is missing from backend environment variables.');
  }

  const payload = new URLSearchParams({
    code,
    client_id: apiKey,
    client_secret: apiSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await axios.post(`${UPSTOX_BASE_URL}/login/authorization/token`, payload.toString(), {
    headers: {
      accept: 'application/json',
      'Api-Version': '2.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });

  return response.data;
};

/**
 * Fetches user profile using the active access token
 */
export const fetchUserProfile = async (accessToken) => {
  const response = await axios.get(`${UPSTOX_BASE_URL}/user/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    timeout: 8000,
  });

  return response.data;
};

/**
 * Revokes the access token on Upstox servers
 */
export const revokeUpstoxToken = async (accessToken) => {
  try {
    const response = await axios.delete(`${UPSTOX_BASE_URL}/logout`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    // Upstox logout can return 400 if token is already expired or invalid
    console.warn(`[Upstox Logout Warning] ${err.response?.data?.message || err.message}`);
    return null;
  }
};
