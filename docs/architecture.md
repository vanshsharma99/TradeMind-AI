# TradeMind AI - System Architecture

## Overview
TradeMind AI is an enterprise-grade options trading analysis workstation designed for Indian derivatives (NIFTY & BANKNIFTY). It bridges high-throughput live market streaming, deterministic quantitative calculations, and AI-assisted qualitative explanations.

## High-Level Architecture Diagram

```
+-------------------------------------------------------------+
|                    React Vite Dashboard                     |
|           (Tailwind CSS, TradingView, Lucide)               |
+------------------------------+------------------------------+
                               |
                   HTTP REST   |  WebSocket / Socket.IO
                               v
+-------------------------------------------------------------+
|                     Node.js / Express                       |
|  - Auth Controller (OAuth 2.0 PKCE / Upstox Token Mgr)      |
|  - Market Feed Manager (Protobuf V3 WebSocket Streamer)     |
|  - Option Chain Aggregator & Cache                          |
|  - Paper Trading Simulated Execution Engine                 |
+--------------+-------------------------------+--------------+
               |                               |
               v                               v
+-------------------------------+  +--------------------------+
|      MongoDB Database         |  |   Python Analytics Hub   |
| - Users & Tokens (Encrypted)  |  | - Quantitative Greeks    |
| - Paper Portfolios & Trades   |  | - Indicators (RSI, VWAP) |
| - Historical Signal Audits    |  | - AI Decision Formatter  |
+-------------------------------+  +--------------------------+
```

## Security & Separation of Concerns
1. **Zero Secret Leakage**: Upstox API Secret and raw access tokens are managed exclusively on the backend server; frontend never sees broker secrets.
2. **Deterministic Trading Engine**: AI LLMs are never allowed to hallucinate market prices, Greeks, or indicator values. All signals are calculated deterministically using quantitative formulas; AI is strictly used to formulate natural language rationale and explanations.
3. **Paper Trading Sandbox**: Order placement is sandboxed with realistic slippage, fee calculations, and strict risk guardrails. Real order execution endpoints are purposefully isolated.
