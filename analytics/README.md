# Analytics Module (Python)

This directory is designated for high-performance quantitative computation, technical indicators, mathematical Greeks calculation (Black-Scholes / Bjerksund-Stensland), and the AI decision explanation engine.

## Prerequisites
- Python 3.10+ or Python 3.11+
- Virtual Environment (`python -m venv .venv`)

## Installation (For Phase 7 & 8)
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

## Structure Planned
- `indicators/`: RSI, EMA, VWAP, MACD, Volume Profile
- `options/`: Greeks (Delta, Gamma, Theta, Vega, Rho), PCR, Max Pain, Implied Volatility calculation
- `ai_engine/`: Deterministic signal engine + narrative generator
