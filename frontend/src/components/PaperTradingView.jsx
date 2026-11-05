import React from 'react';
import { 
  Activity, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  DollarSign,
  PieChart,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function PaperTradingView({ onNavigateToOptionChain }) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#10221A] to-[#0E121B] border border-emerald-900/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <Activity className="h-3.5 w-3.5" />
            <span>Phase 10 Execution Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Virtual Paper Trading Terminal
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Zero financial risk simulation engine. Test algorithmic signals and options strategies with ₹10,00,000 in virtual capital, realistic slippage modeling, and real-time PnL tracking.
          </p>
        </div>

        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 font-mono text-right">
          <div className="text-[11px] text-slate-400 font-sans">Simulated Capital</div>
          <div className="text-2xl font-extrabold text-emerald-400">₹10,00,000.00</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Real Capital At Risk</div>
        </div>
      </div>

      {/* Portfolio Simulation Metrics Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <span>Portfolio Value</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">₹10,00,000</div>
          <div className="text-xs text-slate-400 font-mono">Available Margin: 100%</div>
        </div>

        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <span>Realized P&L</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">+₹0.00</div>
          <div className="text-xs text-slate-400 font-mono">0 Closed Positions</div>
        </div>

        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <span>Win Rate</span>
            <PieChart className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">-- %</div>
          <div className="text-xs text-slate-400 font-mono">Awaiting Initial Trades</div>
        </div>

        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <span>Execution Model</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-slate-200">Realistic Slippage</div>
          <div className="text-xs text-slate-400 font-mono">0.05% Spread Model</div>
        </div>
      </div>

      {/* Architecture Roadmap Info */}
      <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Paper Trading Deployment Timeline</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          To ensure genuine analytical validity, paper trading will be activated in <strong>Phase 10</strong>, immediately following the quantitative backtesting engine (Phase 9) and the AI Decision Engine (Phase 8).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono font-semibold text-blue-400">Step 1: Quantitative Indicators</div>
            <p className="text-xs text-slate-400">
              Compute RSI, EMA, VWAP, and MACD on live ticks (Phase 7).
            </p>
          </div>

          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono font-semibold text-purple-400">Step 2: AI Decision Support</div>
            <p className="text-xs text-slate-400">
              LangGraph + Gemini agent generates deterministic Buy/Sell signals (Phase 8).
            </p>
          </div>

          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono font-semibold text-emerald-400">Step 3: Virtual Execution</div>
            <p className="text-xs text-slate-400">
              Automated virtual order placement, trailing stop-losses, and live PnL (Phase 10).
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Currently analyzing live markets with Upstox Protobuf V3 Feed.
          </span>
          <button
            onClick={onNavigateToOptionChain}
            className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
          >
            <span>Explore Live Option Chain</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
