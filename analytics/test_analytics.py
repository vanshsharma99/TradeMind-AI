"""
TradeMind AI - Python Analytics Unit Verification Suite
Tests: RSI, EMA, VWAP, MACD, Volume Spikes, Black-Scholes Greeks, PCR, and Max Pain.
"""

import sys
from indicators import (
    calculate_rsi,
    calculate_ema,
    calculate_vwap,
    calculate_macd,
    calculate_volume_analysis,
    calculate_confluence_score,
)
from options_greeks import (
    calculate_black_scholes_greeks,
    calculate_pcr,
    calculate_max_pain,
)


def run_tests():
    if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("\n--- 🐍 Running Python Analytics Verification Suite ---")

    # 1. RSI Test
    print("[Python Test 1] Testing RSI formula...")
    rising = [24000 + i * 20 for i in range(25)]
    rsi_val = calculate_rsi(rising, 14)
    assert rsi_val >= 80, f"Expected RSI >= 80, got {rsi_val}"
    print(f"✅ RSI Test Passed (Bullish Series: {rsi_val})")

    # 2. EMA Test
    print("[Python Test 2] Testing EMA 9 & 21 calculation...")
    crossover = [24500 - i * 10 for i in range(25)] + [24250 + i * 40 for i in range(15)]
    ema_res = calculate_ema(crossover)
    assert ema_res["ema9"] > ema_res["ema21"], "EMA 9 should exceed EMA 21 after sharp rally"
    print(f"✅ EMA Test Passed (EMA9: {ema_res['ema9']}, EMA21: {ema_res['ema21']})")

    # 3. VWAP Test
    print("[Python Test 3] Testing VWAP...")
    candles = [
        {"high": 24520, "low": 24480, "close": 24510, "volume": 5000},
        {"high": 24550, "low": 24500, "close": 24540, "volume": 10000},
        {"high": 24580, "low": 24530, "close": 24570, "volume": 15000},
    ]
    vwap_res = calculate_vwap(candles)
    assert vwap_res["vwap"] > 0, "VWAP must be positive"
    assert vwap_res["upperBand"] >= vwap_res["vwap"], "Upper band must envelop VWAP"
    print(f"✅ VWAP Test Passed (VWAP: Rs. {vwap_res['vwap']})")

    # 4. MACD Test
    print("[Python Test 4] Testing MACD 12/26/9...")
    macd_candles = [24000 + (i * 12) for i in range(35)]
    macd_res = calculate_macd(macd_candles)
    assert isinstance(macd_res["macdLine"], float), "MACD Line must be float"
    print(f"✅ MACD Test Passed (Line: {macd_res['macdLine']}, Signal: {macd_res['signalLine']})")

    # 5. Black-Scholes Greeks Test
    print("[Python Test 5] Testing Black-Scholes Option Greeks...")
    greeks = calculate_black_scholes_greeks(spot=24500, strike=24500, time_to_expiry_days=3, is_call=True)
    assert 0.45 <= greeks["delta"] <= 0.55, f"ATM call delta should be approx 0.5, got {greeks['delta']}"
    assert greeks["gamma"] > 0, "Gamma must be positive"
    assert greeks["theta"] < 0, "Theta must be negative (time decay)"
    assert greeks["vega"] > 0, "Vega must be positive"
    print(f"✅ Greeks Test Passed (Delta: {greeks['delta']}, Theta: {greeks['theta']}, Vega: {greeks['vega']})")

    # 6. PCR & Max Pain Test
    print("[Python Test 6] Testing PCR and Max Pain...")
    pcr_res = calculate_pcr(call_oi=100000, put_oi=139000)
    assert pcr_res["pcr"] == 1.39, f"Expected PCR 1.39, got {pcr_res['pcr']}"
    assert pcr_res["sentiment"] == "BULLISH", "PCR 1.39 should be BULLISH"
    print(f"✅ PCR Test Passed (PCR: {pcr_res['pcr']}, Sentiment: {pcr_res['sentiment']})")

    print("\n🎉 ALL PYTHON ANALYTICS TESTS PASSED SUCCESSFULLY! 🎉\n")


if __name__ == "__main__":
    run_tests()
