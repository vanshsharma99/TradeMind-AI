import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Calendar, 
  RefreshCw, 
  Zap, 
  Target, 
  Compass,
  ArrowUpDown,
  Filter
} from 'lucide-react';

export default function OptionChainView() {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE_INDEX|Nifty 50');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Option Chain data
  const fetchOptionChain = async () => {
    try {
      const url = new URL('http://localhost:5000/api/v1/options/chain');
      url.searchParams.set('symbol', selectedSymbol);
      if (selectedExpiry) {
        url.searchParams.set('expiry', selectedExpiry);
      }

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.success && json.data) {
        setChainData(json.data);
        if (json.data.availableExpiries && availableExpiries.length === 0) {
          setAvailableExpiries(json.data.availableExpiries);
          if (!selectedExpiry) {
            setSelectedExpiry(json.data.expiryDate || json.data.availableExpiries[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Option Chain:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOptionChain();
  }, [selectedSymbol, selectedExpiry]);

  // Auto-refresh poll every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchOptionChain, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbol, selectedExpiry, autoRefresh]);

  const analytics = chainData?.analytics || {};
  const strikes = chainData?.strikes || [];
  const spotPrice = chainData?.spotPrice || (selectedSymbol.includes('Bank') ? 52180.25 : 24530.50);

  // Find max OI in chain for bar scaling
  const maxOi = strikes.reduce((max, s) => Math.max(max, s.call.oi, s.put.oi), 1000000);

  // Sentiment styling
  const pcr = analytics.pcr || 1.0;
  const isBullish = pcr >= 1.1;
  const isBearish = pcr <= 0.9;

  return (
    <div className="space-y-6">
      {/* Top Header & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#121721] border border-[#1E2638] rounded-xl p-4">
        {/* Symbol Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedSymbol('NSE_INDEX|Nifty 50');
              setSelectedExpiry('');
              setAvailableExpiries([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              selectedSymbol === 'NSE_INDEX|Nifty 50'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#0B0E14] text-slate-400 hover:text-white border border-[#1E2638]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>NIFTY Options</span>
          </button>

          <button
            onClick={() => {
              setSelectedSymbol('NSE_INDEX|Nifty Bank');
              setSelectedExpiry('');
              setAvailableExpiries([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              selectedSymbol === 'NSE_INDEX|Nifty Bank'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#0B0E14] text-slate-400 hover:text-white border border-[#1E2638]'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>BANKNIFTY Options</span>
          </button>
        </div>

        {/* Expiry Selector & Auto-Refresh Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Expiry Dropdown */}
          <div className="flex items-center space-x-2 bg-[#0B0E14] border border-[#1E2638] rounded-lg px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-slate-400">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="bg-transparent text-xs text-white font-mono font-medium focus:outline-none cursor-pointer"
            >
              {availableExpiries.map((exp) => (
                <option key={exp} value={exp} className="bg-[#121721] text-white">
                  {exp} {exp === availableExpiries[0] ? '(Current Week)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Spot Price Badge */}
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg px-3 py-1.5 flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-400">Spot:</span>
            <span className="font-bold text-white">
              {spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Live / Simulated Data Badge */}
          {chainData?.isSimulated ? (
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SIMULATED CHAIN
            </span>
          ) : (
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE NSE OPTION CHAIN
            </span>
          )}

          {/* Refresh Action */}
          <button
            onClick={fetchOptionChain}
            className="p-2 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-400 hover:text-white transition"
            title="Refresh Option Chain"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analytics Executive Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Put-Call Ratio (PCR) */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Put-Call Ratio (PCR)</div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl font-bold font-mono ${
              isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-blue-400'
            }`}>
              {pcr.toFixed(2)}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
              isBullish ? 'bg-emerald-500/10 text-emerald-400' : isBearish ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
            }`}>
              {analytics.marketSentiment?.replace('_', ' ') || 'NEUTRAL'}
            </span>
          </div>
        </div>

        {/* Max Pain Strike */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Max Pain Strike</div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {analytics.maxPainStrike?.toLocaleString() || '--'}
          </div>
        </div>

        {/* Major Support (Max Put OI) */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Major Support (Put OI)</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {analytics.supportStrike?.toLocaleString() || '--'}
          </div>
        </div>

        {/* Major Resistance (Max Call OI) */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Major Resistance (Call OI)</div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {analytics.resistanceStrike?.toLocaleString() || '--'}
          </div>
        </div>

        {/* Total Call OI */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Total Call OI</div>
          <div className="text-lg font-bold font-mono text-slate-200 truncate">
            {analytics.totalCallOi ? (analytics.totalCallOi / 100000).toFixed(1) + ' L' : '--'}
          </div>
        </div>

        {/* Total Put OI */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Total Put OI</div>
          <div className="text-lg font-bold font-mono text-slate-200 truncate">
            {analytics.totalPutOi ? (analytics.totalPutOi / 100000).toFixed(1) + ' L' : '--'}
          </div>
        </div>
      </div>

      {/* Main Option Chain Matrix */}
      <div className="bg-[#121721] border border-[#1E2638] rounded-xl overflow-hidden">
        {/* Table Subheaders */}
        <div className="grid grid-cols-2 bg-[#0B0E14] border-b border-[#1E2638] text-xs font-bold uppercase tracking-wider py-2 px-4">
          <div className="text-left text-blue-400 flex items-center space-x-1.5">
            <span>CALLS (CE)</span>
            <span className="text-[10px] font-normal text-slate-500 font-mono">Resistance Zone</span>
          </div>
          <div className="text-right text-purple-400 flex items-center justify-end space-x-1.5">
            <span className="text-[10px] font-normal text-slate-500 font-mono">Support Zone</span>
            <span>PUTS (PE)</span>
          </div>
        </div>

        {/* Full Matrix Scroll Container */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs font-mono text-center border-collapse">
            <thead className="bg-[#0E131F] sticky top-0 z-20 border-b border-[#1E2638] text-[11px] text-slate-400">
              <tr>
                {/* Calls Headers */}
                <th className="py-2.5 px-2 text-left">OI (Lakhs)</th>
                <th className="py-2.5 px-2">Volume</th>
                <th className="py-2.5 px-2">IV%</th>
                <th className="py-2.5 px-2">Delta (Δ)</th>
                <th className="py-2.5 px-2">Theta (θ)</th>
                <th className="py-2.5 px-2 text-right bg-blue-950/20 text-blue-300">Call LTP</th>

                {/* Strike Header */}
                <th className="py-2.5 px-3 bg-[#161C2C] text-white font-bold tracking-wider">STRIKE</th>

                {/* Puts Headers */}
                <th className="py-2.5 px-2 text-left bg-purple-950/20 text-purple-300">Put LTP</th>
                <th className="py-2.5 px-2">Theta (θ)</th>
                <th className="py-2.5 px-2">Delta (Δ)</th>
                <th className="py-2.5 px-2">IV%</th>
                <th className="py-2.5 px-2">Volume</th>
                <th className="py-2.5 px-2 text-right">OI (Lakhs)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#182032]">
              {strikes.map((s) => {
                const isAtm = s.isAtm;
                const callOiBarWidth = Math.min(100, (s.call.oi / maxOi) * 100);
                const putOiBarWidth = Math.min(100, (s.put.oi / maxOi) * 100);

                const isITMCall = spotPrice > s.strikePrice;
                const isITMPut = spotPrice < s.strikePrice;

                return (
                  <tr
                    key={s.strikePrice}
                    className={`transition-colors ${
                      isAtm 
                        ? 'bg-amber-500/10 font-bold ring-1 ring-inset ring-amber-500/40' 
                        : 'hover:bg-[#161C2C]/70'
                    }`}
                  >
                    {/* Call OI with Visual Bar */}
                    <td className={`py-2 px-2 text-left relative ${isITMCall ? 'bg-blue-950/10' : ''}`}>
                      <div 
                        className="absolute inset-y-1 left-0 bg-amber-500/15 rounded-r"
                        style={{ width: `${callOiBarWidth}%` }}
                      />
                      <span className="relative z-10 text-slate-300 font-semibold">
                        {(s.call.oi / 100000).toFixed(2)}
                      </span>
                    </td>

                    {/* Call Volume */}
                    <td className={`py-2 px-2 text-slate-400 ${isITMCall ? 'bg-blue-950/10' : ''}`}>
                      {(s.call.volume / 1000).toFixed(0)}k
                    </td>

                    {/* Call IV */}
                    <td className={`py-2 px-2 text-slate-400 ${isITMCall ? 'bg-blue-950/10' : ''}`}>
                      {s.call.greeks?.iv || '--'}
                    </td>

                    {/* Call Delta */}
                    <td className={`py-2 px-2 text-emerald-400/90 ${isITMCall ? 'bg-blue-950/10' : ''}`}>
                      {s.call.greeks?.delta?.toFixed(2) || '--'}
                    </td>

                    {/* Call Theta */}
                    <td className={`py-2 px-2 text-rose-400/80 ${isITMCall ? 'bg-blue-950/10' : ''}`}>
                      {s.call.greeks?.theta?.toFixed(1) || '--'}
                    </td>

                    {/* Call LTP */}
                    <td className={`py-2 px-2 text-right font-bold text-white bg-blue-950/20`}>
                      {s.call.ltp.toFixed(2)}
                    </td>

                    {/* Strike Column (Center) */}
                    <td className={`py-2 px-3 font-extrabold ${
                      isAtm 
                        ? 'bg-amber-500 text-black shadow-md' 
                        : 'bg-[#151B2A] text-white'
                    }`}>
                      <div className="flex items-center justify-center space-x-1">
                        <span>{s.strikePrice}</span>
                        {isAtm && <span className="text-[9px] px-1 bg-black text-amber-400 rounded">ATM</span>}
                      </div>
                    </td>

                    {/* Put LTP */}
                    <td className={`py-2 px-2 text-left font-bold text-white bg-purple-950/20`}>
                      {s.put.ltp.toFixed(2)}
                    </td>

                    {/* Put Theta */}
                    <td className={`py-2 px-2 text-rose-400/80 ${isITMPut ? 'bg-purple-950/10' : ''}`}>
                      {s.put.greeks?.theta?.toFixed(1) || '--'}
                    </td>

                    {/* Put Delta */}
                    <td className={`py-2 px-2 text-rose-400/90 ${isITMPut ? 'bg-purple-950/10' : ''}`}>
                      {s.put.greeks?.delta?.toFixed(2) || '--'}
                    </td>

                    {/* Put IV */}
                    <td className={`py-2 px-2 text-slate-400 ${isITMPut ? 'bg-purple-950/10' : ''}`}>
                      {s.put.greeks?.iv || '--'}
                    </td>

                    {/* Put Volume */}
                    <td className={`py-2 px-2 text-slate-400 ${isITMPut ? 'bg-purple-950/10' : ''}`}>
                      {(s.put.volume / 1000).toFixed(0)}k
                    </td>

                    {/* Put OI with Visual Bar */}
                    <td className={`py-2 px-2 text-right relative ${isITMPut ? 'bg-purple-950/10' : ''}`}>
                      <div 
                        className="absolute inset-y-1 right-0 bg-cyan-500/15 rounded-l"
                        style={{ width: `${putOiBarWidth}%` }}
                      />
                      <span className="relative z-10 text-slate-300 font-semibold">
                        {(s.put.oi / 100000).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
