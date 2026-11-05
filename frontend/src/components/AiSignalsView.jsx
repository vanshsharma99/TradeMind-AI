import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  Layers,
  Code
} from 'lucide-react';

export default function AiSignalsView({ onNavigateToMarket }) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#161226] to-[#0E121B] border border-purple-900/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Phase 8 Agent Architecture Scaffold</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            AI Decision Support Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Multi-step agentic trading workstation powered by LangGraph, deterministic quantitative filters, and LLM reasoning. Zero hallucination guarantee: signals are generated exclusively from verified market data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Activation: Phase 8 (After Phase 7 Indicators)
          </span>
        </div>
      </div>

      {/* Multi-Agent Decision Pipeline Architecture */}
      <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1E2638] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Autonomous Decision Pipeline</h2>
            <p className="text-xs text-slate-400">Sequential deterministic-to-generative agent pipeline</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A2234] text-blue-400">
            Strict Non-Hallucination Design
          </span>
        </div>

        {/* 4-Step Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-3 relative group hover:border-blue-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-mono text-xs font-bold">
                1
              </span>
              <span className="text-[10px] font-mono text-slate-500">PHASE 3 & 4</span>
            </div>
            <div className="text-sm font-semibold text-white">Live Data Ingestion</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upstox Protobuf V3 WebSocket stream decoded in real time. OHLCV candles, 5-level order book, and spot prices.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
              ✓ Operational (Active)
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-3 relative group hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-mono text-xs font-bold">
                2
              </span>
              <span className="text-[10px] font-mono text-slate-500">PHASE 7 (NEXT)</span>
            </div>
            <div className="text-sm font-semibold text-white">Quantitative Analytics</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic RSI (14), EMA (9/21 cross), VWAP deviation, MACD, and volume spike confirmation algorithms.
            </p>
            <div className="text-[11px] font-mono text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
              ⏳ Immediate Next Phase
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-3 relative group hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono text-xs font-bold">
                3
              </span>
              <span className="text-[10px] font-mono text-slate-500">PHASE 5</span>
            </div>
            <div className="text-sm font-semibold text-white">Option Chain Matrix</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Put-Call Ratio (PCR), Max Pain Strike, Support/Resistance OI walls, and Black-Scholes Greeks validation.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
              ✓ Operational (Active)
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-3 relative group hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono text-xs font-bold">
                4
              </span>
              <span className="text-[10px] font-mono text-slate-500">PHASE 8</span>
            </div>
            <div className="text-sm font-semibold text-white">AI Agent Decision</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Structured JSON output: BUY CALL, BUY PUT, or NO TRADE with calculated SL, Target, R:R ratio, and confidence score.
            </p>
            <div className="text-[11px] font-mono text-purple-400 bg-purple-500/5 px-2 py-1 rounded border border-purple-500/10">
              🤖 Agent Framework Ready
            </div>
          </div>
        </div>
      </div>

      {/* Target Signal Schema Specification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <Code className="h-4 w-4 text-blue-400" />
            <span>Structured Output JSON Schema (Deterministic)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            TradeMind AI enforces schema-constrained inference so the frontend receives verified numerical parameters.
          </p>
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
            <pre>{`{
  "signal": "BUY_CALL",
  "instrument": "NIFTY 24550 CE",
  "expiry": "2026-11-09",
  "entryRange": [152.0, 155.0],
  "stopLoss": 138.0,
  "target": 182.0,
  "riskReward": 2.14,
  "confidenceScore": 88,
  "technicalConfluence": {
    "emaCrossover": "Bullish 9/21 cross",
    "rsi": 58.4,
    "vwapPosition": "Above VWAP (24,532)",
    "pcr": 1.39,
    "oiSupport": 24500
  },
  "rationale": "Bullish confluence: price trading above VWAP with rising call volume and strong put OI support at 24500 strike."
}`}</pre>
          </div>
        </div>

        {/* Risk Management Guardrails Card */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Hardcoded Risk Management Safeguards</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every trade signal passes through non-negotiable deterministic capital protection rules:
          </p>
          <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
            <li className="flex items-start gap-2 bg-[#0B0E14] p-2.5 rounded-lg border border-[#1E2638]">
              <span className="text-emerald-400 font-bold">1.</span>
              <span><strong>Strict Risk:Reward:</strong> Minimum 1:1.5 R:R required for signal dispatch.</span>
            </li>
            <li className="flex items-start gap-2 bg-[#0B0E14] p-2.5 rounded-lg border border-[#1E2638]">
              <span className="text-emerald-400 font-bold">2.</span>
              <span><strong>Theta Decay Defense:</strong> Zero OTM buying within 2 hours of weekly expiry.</span>
            </li>
            <li className="flex items-start gap-2 bg-[#0B0E14] p-2.5 rounded-lg border border-[#1E2638]">
              <span className="text-emerald-400 font-bold">3.</span>
              <span><strong>Paper Trading First:</strong> 100% simulated paper execution (Phase 10).</span>
            </li>
            <li className="flex items-start gap-2 bg-[#0B0E14] p-2.5 rounded-lg border border-[#1E2638]">
              <span className="text-emerald-400 font-bold">4.</span>
              <span><strong>Zero Hallucination:</strong> Prices, strikes, and Greeks are verified against live Upstox cache.</span>
            </li>
          </ul>

          <div className="pt-2">
            <button
              onClick={onNavigateToMarket}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
            >
              <span>Inspect Live Market Charts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
