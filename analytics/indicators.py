"""
TradeMind AI - Quantitative Indicators Engine (Python)
Deterministic analytics for Indian Stock Market Derivatives (NIFTY 50 & BANKNIFTY)
Implements: RSI (14, Wilder's Smoothing), EMA (9, 21), VWAP, MACD (12, 26, 9), Volume Spikes & Confluence Scorer.
"""

import math
from typing import List, Dict, Any, Tuple


def calculate_rsi(closes: List[float], period: int = 14) -> float:
    """
    Computes Relative Strength Index (RSI) using Wilder's Smoothed Moving Average.
    Matches standard NSE & TradingView output.
    """
    if len(closes) < period + 1:
        return 50.0

    gains = []
    losses = []
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(0.0, diff))
        losses.append(max(0.0, -diff))

    # Initial simple average
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    # Wilder's smoothing
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0 if avg_gain > 0 else 50.0

    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(rsi, 2)


def calculate_ema_array(closes: List[float], period: int) -> List[float]:
    """
    Calculates Exponential Moving Average array for a given period.
    """
    if not closes:
        return []
    if len(closes) < period:
        sma = sum(closes) / len(closes)
        return [round(sma, 2)] * len(closes)

    k = 2.0 / (period + 1)
    ema_list = []

    # Initial SMA
    initial_sma = sum(closes[:period]) / period
    for i in range(period - 1):
        ema_list.append(round(closes[i], 2))
    ema_list.append(round(initial_sma, 2))

    current_ema = initial_sma
    for i in range(period, len(closes)):
        current_ema = closes[i] * k + current_ema * (1.0 - k)
        ema_list.append(round(current_ema, 2))

    return ema_list


def calculate_ema(closes: List[float]) -> Dict[str, Any]:
    """
    Calculates EMA 9, EMA 21, Golden/Death Crossover, and Trend.
    """
    ema9_series = calculate_ema_array(closes, 9)
    ema21_series = calculate_ema_array(closes, 21)

    if not closes:
        return {"ema9": 0.0, "ema21": 0.0, "trend": "NEUTRAL", "crossover": "NONE", "spread": 0.0}

    curr_ema9 = ema9_series[-1]
    curr_ema21 = ema21_series[-1]
    prev_ema9 = ema9_series[-2] if len(ema9_series) > 1 else curr_ema9
    prev_ema21 = ema21_series[-2] if len(ema21_series) > 1 else curr_ema21

    crossover = "NONE"
    if prev_ema9 <= prev_ema21 and curr_ema9 > curr_ema21:
        crossover = "GOLDEN_CROSS_BULLISH"
    elif prev_ema9 >= prev_ema21 and curr_ema9 < curr_ema21:
        crossover = "DEATH_CROSS_BEARISH"

    trend = "BULLISH" if curr_ema9 > curr_ema21 else "BEARISH" if curr_ema9 < curr_ema21 else "NEUTRAL"
    spread = round(curr_ema9 - curr_ema21, 2)

    return {
        "ema9": curr_ema9,
        "ema21": curr_ema21,
        "trend": trend,
        "crossover": crossover,
        "spread": spread,
    }


def calculate_vwap(candles: List[Dict[str, float]]) -> Dict[str, Any]:
    """
    Calculates Volume Weighted Average Price (VWAP) & Standard Deviation Bands.
    Typical Price = (High + Low + Close) / 3
    """
    if not candles:
        return {"vwap": 0.0, "position": "AT_VWAP", "deviationPercent": 0.0, "upperBand": 0.0, "lowerBand": 0.0}

    cum_pv = 0.0
    cum_vol = 0.0
    typical_prices = []

    for c in candles:
        tp = (c["high"] + c["low"] + c["close"]) / 3.0
        vol = c.get("volume", 100.0) or 100.0
        cum_pv += tp * vol
        cum_vol += vol
        typical_prices.append(tp)

    vwap = cum_pv / cum_vol if cum_vol > 0 else candles[-1]["close"]
    current_close = candles[-1]["close"]
    dev_pct = round(((current_close - vwap) / vwap) * 100.0, 2)

    # Standard deviation
    variance = sum((tp - vwap) ** 2 for tp in typical_prices) / len(typical_prices)
    std_dev = math.sqrt(variance)

    pos = "ABOVE_VWAP_BULLISH" if current_close > vwap else "BELOW_VWAP_BEARISH" if current_close < vwap else "AT_VWAP"

    return {
        "vwap": round(vwap, 2),
        "position": pos,
        "deviationPercent": dev_pct,
        "upperBand": round(vwap + std_dev, 2),
        "lowerBand": round(vwap - std_dev, 2),
    }


def calculate_macd(closes: List[float]) -> Dict[str, Any]:
    """
    Calculates MACD (12, 26, 9) and Momentum state.
    """
    if len(closes) < 26:
        return {"macdLine": 0.0, "signalLine": 0.0, "histogram": 0.0, "crossover": "NONE", "momentum": "NEUTRAL"}

    fast_ema = calculate_ema_array(closes, 12)
    slow_ema = calculate_ema_array(closes, 26)

    macd_line = [fast_ema[i] - slow_ema[i] for i in range(len(closes))]
    signal_line = calculate_ema_array(macd_line, 9)

    curr_macd = round(macd_line[-1], 2)
    curr_signal = round(signal_line[-1], 2)
    curr_hist = round(curr_macd - curr_signal, 2)

    prev_macd = round(macd_line[-2], 2) if len(macd_line) > 1 else curr_macd
    prev_signal = round(signal_line[-2], 2) if len(signal_line) > 1 else curr_signal
    prev_hist = round(prev_macd - prev_signal, 2)

    crossover = "NONE"
    if prev_macd <= prev_signal and curr_macd > curr_signal:
        crossover = "BULLISH_CROSS"
    elif prev_macd >= prev_signal and curr_macd < curr_signal:
        crossover = "BEARISH_CROSS"

    momentum = "NEUTRAL"
    if curr_hist > 0 and curr_hist >= prev_hist:
        momentum = "ACCELERATING_BULLISH"
    elif curr_hist > 0 and curr_hist < prev_hist:
        momentum = "DECELERATING_BULLISH"
    elif curr_hist < 0 and curr_hist <= prev_hist:
        momentum = "ACCELERATING_BEARISH"
    elif curr_hist < 0 and curr_hist > prev_hist:
        momentum = "DECELERATING_BEARISH"

    return {
        "macdLine": curr_macd,
        "signalLine": curr_signal,
        "histogram": curr_hist,
        "crossover": crossover,
        "momentum": momentum,
    }


def calculate_volume_analysis(candles: List[Dict[str, float]]) -> Dict[str, Any]:
    """
    Calculates Volume relative to 20-period SMA and detects institutional spikes.
    """
    if not candles:
        return {"currentVolume": 0, "averageVolume": 0, "spikeRatio": 1.0, "isSpike": False, "status": "NORMAL"}

    volumes = [c.get("volume", 100.0) or 100.0 for c in candles]
    curr_vol = int(volumes[-1])
    lookback = min(20, len(volumes))
    avg_vol = int(sum(volumes[-lookback:]) / lookback)

    spike_ratio = round(curr_vol / avg_vol, 2) if avg_vol > 0 else 1.0
    is_spike = spike_ratio >= 1.5
    status = "VOLUME_SPIKE" if is_spike else "LOW_VOLUME" if spike_ratio < 0.7 else "NORMAL"

    return {
        "currentVolume": curr_vol,
        "averageVolume": avg_vol,
        "spikeRatio": spike_ratio,
        "isSpike": is_spike,
        "status": status,
    }


def calculate_confluence_score(
    rsi: float, 
    ema: Dict[str, Any], 
    vwap: Dict[str, Any], 
    macd: Dict[str, Any], 
    vol: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Multi-Indicator Confluence Scorer (0 to 100).
    Synthesizes EMA, VWAP, RSI, MACD, and Volume Spike into a unified conviction bias.
    """
    score = 50

    # 1. EMA 9/21 Analysis (Weight: 25)
    if ema.get("crossover") == "GOLDEN_CROSS_BULLISH":
        score += 15
    elif ema.get("crossover") == "DEATH_CROSS_BEARISH":
        score -= 15
    elif ema.get("trend") == "BULLISH":
        score += 10
    elif ema.get("trend") == "BEARISH":
        score -= 10

    # 2. VWAP Analysis (Weight: 20)
    if "ABOVE" in vwap.get("position", ""):
        score += 10
        if 0.1 <= vwap.get("deviationPercent", 0) <= 1.0:
            score += 5
    elif "BELOW" in vwap.get("position", ""):
        score -= 10
        if -1.0 <= vwap.get("deviationPercent", 0) <= -0.1:
            score -= 5

    # 3. RSI Analysis (Weight: 20)
    if rsi >= 70:
        score -= 10  # Overbought caution
    elif rsi <= 30:
        score += 10  # Oversold bounce
    elif rsi >= 55:
        score += 10  # Bullish momentum
    elif rsi <= 45:
        score -= 10  # Bearish momentum

    # 4. MACD Analysis (Weight: 20)
    if macd.get("crossover") == "BULLISH_CROSS":
        score += 12
    elif macd.get("crossover") == "BEARISH_CROSS":
        score -= 12
    elif "ACCELERATING_BULLISH" in macd.get("momentum", ""):
        score += 8
    elif "ACCELERATING_BEARISH" in macd.get("momentum", ""):
        score -= 8

    # 5. Volume Confirmation (Weight: 15)
    if vol.get("isSpike"):
        score += 10 if score > 50 else -10

    score = max(5, min(95, score))

    if score >= 70:
        sentiment = "STRONG_BULLISH"
        recommendation = "FAVORS_CALL_BUY"
    elif score >= 58:
        sentiment = "MILD_BULLISH"
        recommendation = "LEAN_CALL_BUY"
    elif score <= 30:
        sentiment = "STRONG_BEARISH"
        recommendation = "FAVORS_PUT_BUY"
    elif score <= 42:
        sentiment = "MILD_BEARISH"
        recommendation = "LEAN_PUT_BUY"
    else:
        sentiment = "NEUTRAL"
        recommendation = "HOLD"

    return {
        "score": score,
        "sentiment": sentiment,
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    import sys
    if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("=================================================")
    print("TradeMind AI - Quantitative Indicators (Python)")
    print("=================================================")

    # Sample NIFTY 50 Synthetic 1m Candles
    sample_candles = [
        {"high": 24500 + i * 2, "low": 24490 + i * 2, "close": 24495 + i * 2.2, "volume": 1000 + i * 80}
        for i in range(30)
    ]
    closes = [c["close"] for c in sample_candles]

    rsi = calculate_rsi(closes, 14)
    ema = calculate_ema(closes)
    vwap = calculate_vwap(sample_candles)
    macd = calculate_macd(closes)
    vol = calculate_volume_analysis(sample_candles)
    confluence = calculate_confluence_score(rsi, ema, vwap, macd, vol)

    print(f"Spot Close: Rs. {closes[-1]:.2f}")
    print(f"RSI (14):   {rsi}")
    print(f"EMA 9/21:   EMA9={ema['ema9']} | EMA21={ema['ema21']} | Trend={ema['trend']}")
    print(f"VWAP:       Rs. {vwap['vwap']} | Pos={vwap['position']}")
    print(f"MACD:       Line={macd['macdLine']} | Signal={macd['signalLine']} | Hist={macd['histogram']}")
    print(f"Volume:     {vol['spikeRatio']}x relative volume | Status={vol['status']}")
    print(f"Confluence: Score={confluence['score']}/100 | Sentiment={confluence['sentiment']} | Rec={confluence['recommendation']}")
    print("=================================================")
