import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Layers,
  Code,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Play
} from 'lucide-react';

export default function AiSignalsView({ onNavigateToMarket, onNavigateToPaperTrading }) {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE_INDEX|Nifty 50');
  const [selectedInterval, setSelectedInterval] = useState('1m');
  const [activeSignal, setActiveSignal] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch latest signal and history
  const fetchSignals = async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch(`http://localhost:5000/api/v1/ai/latest-signal?symbol=${encodeURIComponent(selectedSymbol)}`),
        fetch(`http://localhost:5000/api/v1/ai/history?symbol=${encodeURIComponent(selectedSymbol)}&limit=10`),
      ]);

      const latestJson = await latestRes.json();
      const historyJson = await historyRes.json();

      if (latestJson.success && latestJson.data) {
        setActiveSignal(latestJson.data);
      }
      if (historyJson.success && historyJson.data) {
        setSignalHistory(historyJson.data);
      }
    } catch (err) {
      console.error('Failed to load AI signals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSignals();
  }, [selectedSymbol]);

  // Trigger On-Demand AI Agent Decision Generation
  const handleGenerateSignal = async () => {
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/ai/generate-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          interval: selectedInterval,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setActiveSignal(json.data);
        // Refresh history
        const histRes = await fetch(`http://localhost:5000/api/v1/ai/history?symbol=${encodeURIComponent(selectedSymbol)}&limit=10`);
        const histJson = await histRes.json();
        if (histJson.success) setSignalHistory(histJson.data);
      }
    } catch (err) {
      console.error('Signal generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const isBuyCall = activeSignal?.action === 'BUY_CALL';
  const isBuyPut = activeSignal?.action === 'BUY_PUT';
  const isNoTrade = activeSignal?.action === 'NO_TRADE';

  return (
    <div className="space-y-6">
      {/* Top Filter & Agent Execution Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#121721] border border-[#1E2638] rounded-xl p-4">
        {/* Symbol Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedSymbol('NSE_INDEX|Nifty 50')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              selectedSymbol === 'NSE_INDEX|Nifty 50'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#0B0E14] text-slate-400 hover:text-white border border-[#1E2638]'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>NIFTY 50 Agent</span>
          </button>

          <button
            onClick={() => setSelectedSymbol('NSE_INDEX|Nifty Bank')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              selectedSymbol === 'NSE_INDEX|Nifty Bank'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#0B0E14] text-slate-400 hover:text-white border border-[#1E2638]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>BANKNIFTY Agent</span>
          </button>
        </div>

        {/* Timeframe & Action Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-lg border border-[#1E2638]">
            {['1m', '5m', '15m'].map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedInterval(tf)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                  selectedInterval === tf
                    ? 'bg-[#1E2638] text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Run AI Agent Decision Trigger */}
          <button
            onClick={handleGenerateSignal}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Agent Reasoning...' : 'Run AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Active AI Signal Hero Card */}
      {loading ? (
        <div className="bg-[#121721] border border-[#1E2638] rounded-2xl p-12 text-center text-slate-400 font-mono text-xs">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
          Loading AI Decision Engine state...
        </div>
      ) : activeSignal ? (
        <div className={`rounded-2xl border p-6 md:p-8 space-y-6 transition ${
          isBuyCall 
            ? 'bg-gradient-to-b from-emerald-950/20 via-[#121721] to-[#0E121B] border-emerald-500/30 shadow-lg shadow-emerald-950/20' 
            : isBuyPut 
            ? 'bg-gradient-to-b from-rose-950/20 via-[#121721] to-[#0E121B] border-rose-500/30 shadow-lg shadow-rose-950/20' 
            : 'bg-[#121721] border-[#1E2638]'
        }`}>
          {/* Signal Header Ribbon */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2638] pb-5">
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-1.5 rounded-xl font-mono text-sm font-black tracking-wider uppercase flex items-center gap-2 ${
                isBuyCall 
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30' 
                  : isBuyPut 
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                  : 'bg-slate-700 text-slate-200'
              }`}>
                {isBuyCall ? <TrendingUp className="h-4 w-4" /> : isBuyPut ? <TrendingDown className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>{activeSignal.action.replace('_', ' ')}</span>
              </span>

              <div>
                <h2 className="text-xl font-extrabold text-white font-mono tracking-tight">
                  {activeSignal.instrument}
                </h2>
                <div className="text-xs text-slate-400 font-mono">
                  Expiry: <strong className="text-slate-200">{activeSignal.expiry}</strong> • Spot: <strong className="text-blue-400">₹{activeSignal.spotPriceAtSignal}</strong>
                </div>
              </div>
            </div>

            {/* Confidence & Model Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl px-4 py-2 font-mono text-right">
                <div className="text-[10px] text-slate-400 uppercase">Confidence Score</div>
                <div className="text-xl font-black text-purple-400">{activeSignal.confidenceScore}%</div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#1A2234] text-slate-400 border border-[#1E2638]">
                {activeSignal.modelUsed}
              </span>
            </div>
          </div>

          {/* Pricing Parameters Grid */}
          {!isNoTrade ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Entry Range */}
              <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Recommended Entry</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-white">
                  ₹{activeSignal.entryMin} - ₹{activeSignal.entryMax}
                </div>
                <div className="text-[11px] text-blue-400 font-mono">At or near current LTP</div>
              </div>

              {/* Stop Loss */}
              <div className="bg-[#0B0E14] border border-rose-500/20 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Strict Stop Loss</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-rose-400">
                  ₹{activeSignal.stopLoss}
                </div>
                <div className="text-[11px] text-rose-400/80 font-mono">Risk: ~16% Capital</div>
              </div>

              {/* Target */}
              <div className="bg-[#0B0E14] border border-emerald-500/20 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Target Price</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                  ₹{activeSignal.target}
                </div>
                <div className="text-[11px] text-emerald-400/80 font-mono">Reward: ~32% Profit</div>
              </div>

              {/* Risk:Reward Ratio */}
              <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Risk : Reward</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-purple-400">
                  1 : {activeSignal.riskReward}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Approved ≥ 1:1.5</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0B0E14] border border-amber-500/20 rounded-xl p-4 text-xs font-mono text-amber-300 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <span>Capital Preservation Mode: No directional setup meets the required 60% confluence threshold. Rangebound consolidation detected.</span>
            </div>
          )}

          {/* AI Reasoning Thesis & Risk Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>Agent Rationale & Setup Thesis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeSignal.detailedReasoning}
              </p>
            </div>

            <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Invalidation Criteria & Risk Warning</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeSignal.riskWarning || 'Monitor theta decay and key support/resistance boundaries.'}
              </p>
            </div>
          </div>

          {/* Quantitative Confluence Verification Pills */}
          {activeSignal.technicalConfluence && (
            <div className="border-t border-[#1E2638] pt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400">Deterministic Analytical Verification:</div>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-300">
                  RSI (14): <strong className="text-purple-400">{activeSignal.technicalConfluence.rsi}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-300">
                  EMA Cross: <strong className="text-blue-400">{activeSignal.technicalConfluence.emaCross}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-300">
                  VWAP: <strong className="text-amber-400">{activeSignal.technicalConfluence.vwapPosition?.replace('_', ' ')}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-300">
                  MACD: <strong className="text-white">{activeSignal.technicalConfluence.macdMomentum?.replace('_', ' ')}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-300">
                  PCR: <strong className="text-emerald-400">{activeSignal.technicalConfluence.pcr}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-300">
                  Max Pain: <strong className="text-slate-200">{activeSignal.technicalConfluence.maxPain}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Action Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Signal Timestamp: {new Date(activeSignal.createdAt).toLocaleString()}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToMarket}
                className="px-3.5 py-2 rounded-lg bg-[#0B0E14] hover:bg-[#1A2234] border border-[#1E2638] text-slate-300 hover:text-white text-xs font-medium transition"
              >
                Inspect Live Chart
              </button>

              <button
                onClick={onNavigateToPaperTrading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <span>Stage in Paper Trading</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Historical Signals Ledger Table */}
      <div className="bg-[#121721] border border-[#1E2638] rounded-xl overflow-hidden space-y-0">
        <div className="p-4 border-b border-[#1E2638] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Historical AI Signals Ledger</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Recorded: {signalHistory.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-[#0B0E14] text-slate-400 uppercase text-[10px] border-b border-[#1E2638]">
              <tr>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4">Signal</th>
                <th className="py-2.5 px-4">Contract</th>
                <th className="py-2.5 px-4">Entry Range</th>
                <th className="py-2.5 px-4">Stop Loss</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">R:R</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-slate-300">
              {signalHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No signals generated yet. Click "Run AI Analysis" above to generate the first signal.
                  </td>
                </tr>
              ) : (
                signalHistory.map((s) => (
                  <tr key={s._id} className="hover:bg-[#151D2C] transition">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        s.action === 'BUY_CALL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        s.action === 'BUY_PUT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {s.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">{s.instrument}</td>
                    <td className="py-3 px-4 text-slate-300">{s.entryMin > 0 ? `₹${s.entryMin} - ₹${s.entryMax}` : '--'}</td>
                    <td className="py-3 px-4 text-rose-400">{s.stopLoss > 0 ? `₹${s.stopLoss}` : '--'}</td>
                    <td className="py-3 px-4 text-emerald-400">{s.target > 0 ? `₹${s.target}` : '--'}</td>
                    <td className="py-3 px-4 text-purple-400">{s.riskReward > 0 ? `1:${s.riskReward}` : '--'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px]">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
