# TradeMind AI – AI-Powered Options Trading Analysis Platform

TradeMind AI is a modern, high-performance financial analysis workstation tailored for Indian stock market derivatives (specifically **NIFTY 50** and **BANKNIFTY** options).

> **Important**: This platform is engineered strictly for market analysis, quantitative backtesting, and paper trading. Real-money order execution is intentionally disabled.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide React, TradingView Lightweight Charts (Phase 6), Socket.IO Client.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, Axios, dotenv.
- **Analytics Engine**: Python, Pandas, NumPy, Scipy (Black-Scholes & Greeks).
- **Market Data**: Upstox Developer API (OAuth 2.0, Market Data Feed V3 Protobuf WebSocket, Option Chain API).

---

## 📂 Project Architecture

```
TradeMind AI/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & Database config
│   │   ├── controllers/     # API request controllers
│   │   ├── middleware/      # Error handling, Auth, Security
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic & Upstox integrations
│   │   ├── utils/           # Helper functions & formatters
│   │   ├── websocket/       # Upstox V3 & Client WebSocket managers
│   │   └── server.js        # Main Express server entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # UI components
│   │   ├── App.jsx          # Dashboard application root
│   │   ├── index.css        # Tailwind styling
│   │   └── main.jsx         # Vite React mounting
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── analytics/
│   ├── requirements.txt     # Python quantitative dependencies
│   └── README.md
├── docs/
│   └── architecture.md      # Architecture & system design
├── .gitignore
├── .env.example
└── README.md
```

---

## 🚀 Incremental Roadmap

- [x] **Phase 1: Project Setup & Environment Configuration** *(Completed)*
- [x] **Phase 2: Upstox OAuth 2.0 Authentication** *(Completed)*
- [x] **Phase 3: Connect Upstox Market Data Feed V3** *(Completed)*
- [x] **Phase 4: Receive & Decode Live NIFTY Market Data** *(Completed)*
- [x] **Phase 5: Integrate Option Chain API** *(Completed)*
- [ ] **Phase 6: Build React Dashboard & Charts**
- [ ] **Phase 5: Integrate Option Chain API**
- [ ] **Phase 6: Build React Dashboard & Charts**
- [ ] **Phase 7: Implement Technical Indicators**
- [ ] **Phase 8: Develop AI Decision Engine**
- [ ] **Phase 9: Implement Backtesting**
- [ ] **Phase 10: Implement Paper Trading Engine**
- [ ] **Phase 11: Testing, Optimization & Deployment**

---

## ⚡ Phase 1 Verification & How to Run

### Prerequisites
1. **Node.js**: v18.0.0+ (Tested on v24.13.0)
2. **MongoDB**: Local MongoDB community service running on `mongodb://127.0.0.1:27017`
3. **Python**: Python 3.10+ or 3.11+ (Required for Phase 7 onwards)

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
# Server will start on http://localhost:5000
```

Verify backend health:
```bash
curl http://localhost:5000/api/health
```

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
# App will run on http://localhost:5173
```

### 3. Verify Phase 2 Authentication Suite
Run the automated end-to-end authentication test script:
```bash
cd backend
node src/testAuth.js
```

### 4. Verify Phase 3 Market Data Feed V3 & Protobuf Suite
Run the automated Protobuf compilation, binary round-trip, and stream verification test script:
```bash
cd backend
node src/testFeed.js
```

### 5. Verify Phase 4 Live Market Data & Candle Engine Suite
Run the automated candlestick aggregator, 5-level order book, and depth verification test script:
```bash
cd backend
node src/testCandles.js
```

### 6. Verify Phase 5 Option Chain Engine Suite
Run the automated Option Chain matrix, Greeks, PCR, and Max Pain verification test script:
```bash
cd backend
node src/testOptionChain.js
```
The test verifies:
- Weekly option expiry dates calculation for NIFTY (Thursdays) and BANKNIFTY (Wednesdays)
- 21-strike Option Chain matrix generation centered around current spot price
- Black-Scholes Greeks computation (Delta, Gamma, Theta, Vega, and IV)
- Quantitative Put-Call Ratio (PCR) and sentiment analysis
- Max Pain Strike and Major Support (Max Put OI) & Resistance (Max Call OI) detection
- REST endpoints: `GET /api/v1/options/chain`, `GET /api/v1/options/expiries`, `GET /api/v1/options/analytics`

Open `http://localhost:5173` in your browser. Click the **"Option Chain"** tab in the sidebar to view the full interactive matrix with ATM strike highlighting, Greeks, and visual Open Interest accumulation bars!
