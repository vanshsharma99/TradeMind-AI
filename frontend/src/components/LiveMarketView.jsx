import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Layers, 
  Clock, 
  Activity, 
  ArrowRight, 
  RefreshCw,
  Scale,
  Zap,
  ShieldAlert
} from 'lucide-react';
import TradingViewChart from './TradingViewChart.jsx';

export default function LiveMarketView() {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE_INDEX|Nifty 50');
  const [selectedInterval, setSelectedInterval] = useState('1m');
  const [candles, setCandles] = useState([]);
  const [depthData, setDepthData] = useState(null);
  const [currentTick, setCurrentTick] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial candles & depth via REST API
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [candleRes, depthRes] = await Promise.all([
        fetch(`http://localhost:5000/api/v1/market/candles?symbol=${encodeURIComponent(selectedSymbol)}&interval=${selectedInterval}&limit=60`),
        fetch(`http://localhost:5000/api/v1/market/depth?symbol=${encodeURIComponent(selectedSymbol)}`),
      ]);

      const candleJson = await candleRes.json();
      const depthJson = await depthRes.json();

      if (candleJson.success) setCandles(candleJson.data || []);
      if (depthJson.success) setDepthData(depthJson.data || null);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedSymbol, selectedInterval]);

  // Real-time socket stream
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('market:tick', (tick) => {
      if (tick.instrumentKey === selectedSymbol) {
        setCurrentTick(tick);
      }
    });

    socket.on('candle:update', (data) => {
      if (data.instrumentKey === selectedSymbol && data.interval === selectedInterval) {
        setCandles((prev) => {
          if (prev.length === 0) return [data.candle];
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.time === data.candle.time) {
            updated[lastIdx] = data.candle;
          } else {
            updated.push(data.candle);
            if (updated.length > 20) updated.shift();
          }
          return updated;
        });
      }
    });

    socket.on('market:depth', (depth) => {
      if (depth.instrumentKey === selectedSymbol) {
        setDepthData(depth);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedSymbol, selectedInterval]);

  const ltp = currentTick?.ltp || depthData?.ltp || (selectedSymbol.includes('Bank') ? 52180.25 : 24530.50);
  const closePrice = currentTick?.closePrice || depthData?.stats?.closePrice || (selectedSymbol.includes('Bank') ? 52050 : 24480);
  const change = Number((ltp - closePrice).toFixed(2));
  const changePercent = Number(((change / closePrice) * 100).toFixed(2));
  const isPositive = change >= 0;

  const dayHigh = depthData?.stats?.dayHigh || ltp + 45;
  const dayLow = depthData?.stats?.dayLow || ltp - 35;
  const vwap = depthData?.stats?.vwap || ltp;

  // Calculate range percentage for intraday meter
  const rangeSpan = Math.max(1, dayHigh - dayLow);
  const rangePos = Math.min(100, Math.max(0, ((ltp - dayLow) / rangeSpan) * 100));

  const maxBidQty = depthData?.bids ? Math.max(...depthData.bids.map((b) => b.qty)) : 500;
  const maxAskQty = depthData?.asks ? Math.max(...depthData.asks.map((a) => a.qty)) : 500;

  return (
    <div className="space-y-6">
      {/* Top Controls & Index Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121721] border border-[#1E2638] rounded-xl p-4">
        {/* Symbol Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedSymbol('NSE_INDEX|Nifty 50')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              selectedSymbol === 'NSE_INDEX|Nifty 50'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#0B0E14] text-slate-400 hover:text-white border border-[#1E2638]'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>NIFTY 50</span>
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
            <span>BANKNIFTY</span>
          </button>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center space-x-1.5 bg-[#0B0E14] p-1 rounded-lg border border-[#1E2638]">
          <span className="text-[11px] text-slate-500 px-2 font-medium">Timeframe:</span>
          {['1m', '5m', '15m'].map((intvl) => (
            <button
              key={intvl}
              onClick={() => setSelectedInterval(intvl)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                selectedInterval === intvl
                  ? 'bg-[#1E2638] text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {intvl}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stats Card */}
      <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Price & Change */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                {selectedSymbol.includes('Bank') ? 'BANKNIFTY Spot Index' : 'NIFTY 50 Spot Index'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Feed
              </span>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                {ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className={`flex items-center text-sm font-semibold font-mono ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                <span>{isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>

          {/* Intraday Range Meter */}
          <div className="space-y-2 md:col-span-2 bg-[#0B0E14] border border-[#1E2638] rounded-lg p-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Day Low: <strong className="text-slate-200">{dayLow.toFixed(2)}</strong></span>
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider text-blue-400">Intraday Range</span>
              <span className="text-slate-400">Day High: <strong className="text-slate-200">{dayHigh.toFixed(2)}</strong></span>
            </div>

            {/* Visual Progress Bar */}
            <div className="relative w-full h-2.5 bg-[#1A2234] rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full"
                style={{ width: `${rangePos}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>VWAP: <strong className="text-purple-400">{vwap.toFixed(2)}</strong></span>
              <span>Prev Close: <strong className="text-slate-400">{closePrice.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Interactive TradingView Candlestick Chart */}
      <TradingViewChart 
        candles={candles} 
        symbol={selectedSymbol} 
        interval={selectedInterval} 
        height={380} 
      />

      {/* Grid: 5-Level Market Depth & Live Candlestick Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5-Level Market Depth (Order Book) */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
            <div className="flex items-center space-x-2">
              <Scale className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">5-Level Market Depth (Order Book)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A2234] text-slate-300">
              Spread: {depthData?.spread || 0.25} pts
            </span>
          </div>

          {/* Buyer vs Seller Ratio Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-400 font-semibold">Buyers: {depthData?.buyerRatio || 50}%</span>
              <span className="text-rose-400 font-semibold">Sellers: {depthData?.sellerRatio || 50}%</span>
            </div>
            <div className="w-full h-2 bg-rose-500/30 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${depthData?.buyerRatio || 50}%` }}
              />
            </div>
          </div>

          {/* Depth Table */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* Bids Column */}
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-slate-500 font-semibold text-[10px] uppercase pb-1 border-b border-[#1E2638]">
                <span>Orders</span>
                <span className="text-right">Qty</span>
                <span className="text-right text-emerald-400">Bid</span>
              </div>
              {depthData?.bids?.map((bid, i) => (
                <div key={i} className="relative grid grid-cols-3 py-1 px-1 rounded overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-emerald-500/10 pointer-events-none"
                    style={{ width: `${(bid.qty / maxBidQty) * 100}%` }}
                  />
                  <span className="text-slate-400 z-10">{bid.orders}</span>
                  <span className="text-right text-slate-300 z-10">{bid.qty}</span>
                  <span className="text-right font-bold text-emerald-400 z-10">{bid.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1E2638] flex justify-between text-xs text-slate-400">
                <span>Total Bid Qty:</span>
                <strong className="text-emerald-400">{depthData?.totalBidQty?.toLocaleString() || '--'}</strong>
              </div>
            </div>

            {/* Asks Column */}
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-slate-500 font-semibold text-[10px] uppercase pb-1 border-b border-[#1E2638]">
                <span className="text-rose-400">Ask</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Orders</span>
              </div>
              {depthData?.asks?.map((ask, i) => (
                <div key={i} className="relative grid grid-cols-3 py-1 px-1 rounded overflow-hidden">
                  <div 
                    className="absolute inset-0 right-0 bg-rose-500/10 pointer-events-none"
                    style={{ width: `${(ask.qty / maxAskQty) * 100}%` }}
                  />
                  <span className="font-bold text-rose-400 z-10">{ask.price.toFixed(2)}</span>
                  <span className="text-right text-slate-300 z-10">{ask.qty}</span>
                  <span className="text-right text-slate-400 z-10">{ask.orders}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1E2638] flex justify-between text-xs text-slate-400">
                <span>Total Ask Qty:</span>
                <strong className="text-rose-400">{depthData?.totalAskQty?.toLocaleString() || '--'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live Candlestick Stream Monitor */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Aggregated Candlesticks ({selectedInterval})</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Aggregator Active
            </span>
          </div>

          {/* Candle Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1E2638] pb-1">
                  <th className="py-1.5">Time</th>
                  <th className="text-right">Open</th>
                  <th className="text-right">High</th>
                  <th className="text-right">Low</th>
                  <th className="text-right">Close</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2234]">
                {candles.slice(-8).reverse().map((c, idx) => {
                  const isGreen = c.close >= c.open;
                  const dateStr = new Date(c.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <tr key={idx} className="hover:bg-[#1A2234]/50 transition">
                      <td className="py-2 text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{dateStr}</span>
                      </td>
                      <td className="text-right text-slate-300">{c.open.toFixed(2)}</td>
                      <td className="text-right text-emerald-400/90">{c.high.toFixed(2)}</td>
                      <td className="text-right text-rose-400/90">{c.low.toFixed(2)}</td>
                      <td className={`text-right font-bold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.close.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          c.isClosed 
                            ? 'bg-slate-800 text-slate-400' 
                            : 'bg-blue-500/20 text-blue-400 animate-pulse'
                        }`}>
                          {c.isClosed ? 'Closed' : 'Forming'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-[#1E2638] flex items-center justify-between text-xs text-slate-400">
            <span>Aggregating raw Upstox Protobuf ticks into candles</span>
            <span className="font-mono text-emerald-400">Buffer: {candles.length} candles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
