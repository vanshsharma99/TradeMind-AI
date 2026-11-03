# Upstox Developer API V3 Integration Notes

This reference document outlines official requirements and specifications from [Upstox Developer Documentation](https://upstox.com/developer/api-documentation/).

---

## 1. Authentication (OAuth 2.0)
- **Authorization Endpoint**: `https://api.upstox.com/v2/login/authorization/dialog`
- **Token Endpoint**: `POST https://api.upstox.com/v2/login/authorization/token`
- **Parameters Required**:
  - `code`: Authorization code from user consent redirect
  - `client_id`: API Key
  - `client_secret`: API Secret (Kept strictly on Backend)
  - `redirect_uri`: Configured callback URL
  - `grant_type`: `authorization_code`
- **Token Characteristics**:
  - Access token expires daily at approximately 03:30 AM IST.
  - Requires fresh OAuth login each trading day.
  - Token is stored securely in MongoDB or encrypted memory cache.

---

## 2. Market Data Feed V3 (WebSocket)
- **Protocol**: Binary WebSocket stream with **Google Protocol Buffers (Protobuf)**.
- **WebSocket Endpoint**: Obtained dynamically from `GET https://api.upstox.com/v2/feed/market-data-feed/authorize`.
- **Feed Modes**:
  - `LTPC` (Last Traded Price & Close)
  - `FULL` (Depth, Greeks, OI, Volume, OHLC, 52w High/Low)
- **Payload Schema**: `MarketDataFeed.proto` provided by Upstox official repository.

---

## 3. Option Chain & Market Depth
- **Option Chain Endpoint**: `GET https://api.upstox.com/v2/option/chain`
- **Instruments Covered**:
  - `NSE_INDEX|Nifty 50`
  - `NSE_INDEX|Nifty Bank`
- **Data Extracted**:
  - Strike Price, Expiry Date, Spot Price
  - CE / PE LTP, Bid/Ask, OI, PCR, Greeks (Delta, Theta, Gamma, Vega, IV)
