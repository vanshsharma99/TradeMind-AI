"""
TradeMind AI - Options Pricing & Greeks Analytics Engine (Python)
Implements: Black-Scholes Pricing, Delta, Gamma, Theta, Vega, PCR & Max Pain Strike.
Tailored for Indian NSE Options (NIFTY 50 & BANKNIFTY).
"""

import math
import sys
from typing import Dict, Any, List


def normal_cdf(x: float) -> float:
    """
    Standard normal cumulative distribution function (CDF) approximation.
    """
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def normal_pdf(x: float) -> float:
    """
    Standard normal probability density function (PDF).
    """
    return (1.0 / math.sqrt(2.0 * math.pi)) * math.exp(-0.5 * x * x)


def calculate_black_scholes_greeks(
    spot: float,
    strike: float,
    time_to_expiry_days: float,
    is_call: bool,
    iv: float = 13.5,
    risk_free_rate: float = 0.065
) -> Dict[str, float]:
    """
    Calculates Black-Scholes Greeks for European options on Indian Indices (NIFTY/BANKNIFTY).
    """
    t = max(0.001, time_to_expiry_days / 365.0)
    sigma = max(0.01, iv / 100.0)
    r = risk_free_rate

    d1 = (math.log(spot / strike) + (r + 0.5 * sigma * sigma) * t) / (sigma * math.sqrt(t))
    d2 = d1 - sigma * math.sqrt(t)

    # Theoretical Price
    if is_call:
        price = spot * normal_cdf(d1) - strike * math.exp(-r * t) * normal_cdf(d2)
        delta = normal_cdf(d1)
    else:
        price = strike * math.exp(-r * t) * normal_cdf(-d2) - spot * normal_cdf(-d1)
        delta = normal_cdf(d1) - 1.0

    gamma = normal_pdf(d1) / (spot * sigma * math.sqrt(t))
    vega = (spot * math.sqrt(t) * normal_pdf(d1)) / 100.0
    
    # 1-day Theta decay in points
    theta_annual = (-(spot * sigma * normal_pdf(d1)) / (2.0 * math.sqrt(t))) - (
        r * strike * math.exp(-r * t) * (normal_cdf(d2) if is_call else normal_cdf(-d2))
    )
    theta = theta_annual / 365.0

    return {
        "price": round(price, 2),
        "delta": round(delta, 3),
        "gamma": round(gamma, 5),
        "theta": round(theta, 2),
        "vega": round(vega, 2),
        "iv": round(iv, 2),
    }


def calculate_pcr(call_oi: float, put_oi: float) -> Dict[str, Any]:
    """
    Calculates Put-Call Ratio and Market Sentiment.
    """
    pcr = round(put_oi / call_oi, 2) if call_oi > 0 else 1.0
    sentiment = "BULLISH" if pcr >= 1.1 else "BEARISH" if pcr <= 0.85 else "NEUTRAL"
    return {"pcr": pcr, "sentiment": sentiment}


def calculate_max_pain(strikes: List[Dict[str, Any]]) -> float:
    """
    Calculates Max Pain strike where option sellers experience minimum collective payout.
    """
    if not strikes:
        return 0.0

    min_loss = float("inf")
    max_pain_strike = strikes[0]["strikePrice"]

    for target in strikes:
        k = target["strikePrice"]
        total_payout = 0.0

        for s in strikes:
            curr_strike = s["strikePrice"]
            # Call buyer payoff
            if k > curr_strike:
                total_payout += (k - curr_strike) * s.get("call", {}).get("oi", 0)
            # Put buyer payoff
            elif k < curr_strike:
                total_payout += (curr_strike - k) * s.get("put", {}).get("oi", 0)

        if total_payout < min_loss:
            min_loss = total_payout
            max_pain_strike = k

    return max_pain_strike


if __name__ == "__main__":
    if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("=================================================")
    print("TradeMind AI - Option Greeks & Analytics (Python)")
    print("=================================================")

    spot = 24536.60
    strike = 24550.00
    days = 3.5

    ce_greeks = calculate_black_scholes_greeks(spot, strike, days, is_call=True, iv=14.5)
    pe_greeks = calculate_black_scholes_greeks(spot, strike, days, is_call=False, iv=15.2)

    print(f"Underlying Spot:  Rs. {spot:.2f} | Strike: {strike:.2f} ({days} days to expiry)")
    print(f"ATM Call (CE):   Price: Rs. {ce_greeks['price']} | Delta: {ce_greeks['delta']} | Theta: {ce_greeks['theta']} | Vega: {ce_greeks['vega']}")
    print(f"ATM Put (PE):    Price: Rs. {pe_greeks['price']} | Delta: {pe_greeks['delta']} | Theta: {pe_greeks['theta']} | Vega: {pe_greeks['vega']}")

    pcr_result = calculate_pcr(call_oi=141978265, put_oi=197748395)
    print(f"NSE NIFTY PCR:    {pcr_result['pcr']} ({pcr_result['sentiment']})")
    print("=================================================")
