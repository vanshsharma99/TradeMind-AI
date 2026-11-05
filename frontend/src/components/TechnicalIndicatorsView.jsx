import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Layers, 
  Zap, 
  BarChart2, 
  Gauge, 
  Compass, 
  ShieldAlert, 
  ArrowUpRight,
  Sparkles,
  Percent
} from 'lucide-react';
import TradingViewChart from './TradingViewChart.jsx';

export default function TechnicalIndicatorsView() {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE_INDEX|Nifty 50');
  const [selectedInterval, setSelectedInterval] = useState('1m');
  const [indicatorsData, setIndicatorsData] = useState(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchIndicatorData = async () => {
    try {
      const [indRes, candleRes] = await Promise.all([
        fetch(`http://localhost:5000/api/v1/indicators?symbol=${encodeURIComponent(selectedSymbol)}&interval=${selectedInterval}`),
        fetch(`http://localhost:5000/api/v1/market/candles?symbol=${encodeURIComponent(selectedSymbol)}&interval=${selectedInterval}&limit=50`)
      ]);

      const indJson = await indRes.json();
      const candleJson = await candleRes.json();

      if (indJson.success && indJson.data) {
        setIndicatorsData(indJson.data);
      }
      if (candleJson.success && candleJson.data) {
        setCandles(candleJson.data);
      }
    } catch (err) {
      console.error('Failed to load indicators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchIndicatorData();
  }, [selectedSymbol, selectedInterval]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchIndicatorData, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol, selectedInterval, autoRefresh]);

  const indicators = indicatorsData?.indicators || {};
  const confluence = indicatorsData?.confluence || { score: 50, sentiment: 'NEUTRAL', recommendation: 'HOLD' };
  const rsi = indicators.rsi || { value: 50, zone: 'BULLISH_ZONE' };
  const ema = indicators.ema || { ema9: 0, ema21: 0, spread: 0, trend: 'NEUTRAL', crossover: 'NONE' };
  const vwap = indicators.vwap || { vwap: 0, position: 'AT_VWAP', deviationPercent: 0, upperBand: 0, lowerBand: 0 };
  const macd = indicators.macd || { macdLine: 0, signalLine: 0, histogram: 0, crossover: 'NONE', momentum: 'NEUTRAL' };
  const volume = indicators.volume || { currentVolume: 0, averageVolume: 0, spikeRatio: 1, isSpike: false, status: 'NORMAL' };
  const spotPrice = indicatorsData?.spotPrice || 24536.60;

  // Sentiment Colors
  const isBullish = confluence.sentiment.includes('BULLISH');
  const isBearish = confluence.sentiment.includes('BEARISH');
  const sentimentColor = isBullish 
    ? 'text-emerald-400' 
    : isBearish 
    ? 'text-rose-400' 
    : 'text-blue-400';

  const sentimentBg = isBullish 
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
    : isBearish 
    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
    : 'bg-blue-500/10 border-blue-500/20 text-blue-400';

  return (
    <div className="space-y-6">
      {/* Top Filter & Symbol Switcher Bar */}
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

        {/* Timeframe & Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Timeframe selector */}
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

          {/* Spot Price Badge */}
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg px-3 py-1.5 flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-400">Spot:</span>
            <span className="font-bold text-white">
              ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-[#0B0E14] text-slate-400 border-[#1E2638]'
            }`}
            title="Auto-refresh every 5s"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{autoRefresh ? 'Auto-5s' : 'Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchIndicatorData}
            className="p-2 rounded-lg bg-[#0B0E14] border border-[#1E2638] text-slate-400 hover:text-white transition"
            title="Refresh Technical Indicators"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Confluence Conviction Score Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#121721] via-[#151D2C] to-[#0E121B] border border-[#1E2638] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Technical Confluence Conviction
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                5 Deterministic Algorithms
              </span>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${sentimentColor}`}>
                {confluence.score}
                <span className="text-xl text-slate-500 font-normal">/100</span>
              </span>
              <div className="space-y-1">
                <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border font-mono uppercase ${sentimentBg}`}>
                  {confluence.sentiment.replace('_', ' ')}
                </span>
                <div className="text-xs font-mono text-slate-400">
                  Bias: <strong className="text-white">{confluence.recommendation.replace('_', ' ')}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Confluence Progress Bar */}
          <div className="w-full md:w-1/2 space-y-2 bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-rose-400">0 Bearish</span>
              <span className="text-slate-400">50 Neutral</span>
              <span className="text-emerald-400">100 Bullish</span>
            </div>
            <div className="relative w-full h-3 bg-[#1A2234] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isBullish 
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-400' 
                    : isBearish 
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${confluence.score}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Weights: EMA (25%) • VWAP (20%) • RSI (20%) • MACD (20%) • Vol (15%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 5 Detailed Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: RSI (14) */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">RSI (14)</span>
            <Gauge className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${
              rsi.value >= 70 ? 'text-rose-400' : rsi.value <= 30 ? 'text-emerald-400' : 'text-white'
            }`}>
              {rsi.value}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
              rsi.value >= 70 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                : rsi.value <= 30 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {rsi.zone.replace('_', ' ')}
            </span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-[#1A2234] rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-300" 
                style={{ width: `${Math.min(100, Math.max(0, rsi.value))}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>30 Oversold</span>
              <span>70 Overbought</span>
            </div>
          </div>
        </div>

        {/* Card 2: EMA 9 & 21 Crossover */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">EMA 9 / 21</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">EMA 9:</span>
              <span className="font-bold text-blue-400">{ema.ema9?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">EMA 21:</span>
              <span className="font-bold text-purple-400">{ema.ema21?.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#1E2638] text-[10px] font-mono">
            <span className="text-slate-400">Spread: {ema.spread > 0 ? `+${ema.spread}` : ema.spread}</span>
            <span className={`px-1.5 py-0.5 rounded font-semibold ${
              ema.trend === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {ema.crossover !== 'NONE' ? ema.crossover.replace('_', ' ') : ema.trend}
            </span>
          </div>
        </div>

        {/* Card 3: VWAP Benchmark */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Intraday VWAP</span>
            <Compass className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-400">
              ₹{vwap.vwap?.toFixed(2)}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
              vwap.position.includes('ABOVE') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {vwap.deviationPercent > 0 ? `+${vwap.deviationPercent}%` : `${vwap.deviationPercent}%`}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 space-y-0.5 border-t border-[#1E2638] pt-1">
            <div className="flex justify-between">
              <span>Upper (+1σ):</span>
              <span className="text-slate-300 font-bold">{vwap.upperBand?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Lower (-1σ):</span>
              <span className="text-slate-300 font-bold">{vwap.lowerBand?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: MACD (12, 26, 9) */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">MACD (12, 26, 9)</span>
            <BarChart2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">MACD:</span>
              <span className="font-bold text-white">{macd.macdLine?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Signal:</span>
              <span className="font-bold text-slate-300">{macd.signalLine?.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#1E2638] text-[10px] font-mono">
            <span className="text-slate-400">Hist: <strong className={macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{macd.histogram?.toFixed(2)}</strong></span>
            <span className={`px-1.5 py-0.5 rounded font-semibold ${
              macd.momentum.includes('BULLISH') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {macd.momentum.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Card 5: Volume Spike Detector */}
        <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Volume Profile</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-cyan-400">
              {volume.spikeRatio}x
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
              volume.isSpike 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse' 
                : 'bg-[#1E2638] text-slate-400'
            }`}>
              {volume.status}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 space-y-0.5 border-t border-[#1E2638] pt-1">
            <div className="flex justify-between">
              <span>Latest Vol:</span>
              <span className="text-slate-300 font-bold">{volume.currentVolume?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>20-SMA Vol:</span>
              <span className="text-slate-300 font-bold">{volume.averageVolume?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Candlestick Chart with Indicator Data */}
      <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Live OHLCV Chart with Indicator Confluence</h3>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              EMA 9: {ema.ema9?.toFixed(2)}
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              EMA 21: {ema.ema21?.toFixed(2)}
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              VWAP: {vwap.vwap?.toFixed(2)}
            </span>
          </div>
        </div>

        <TradingViewChart 
          candles={candles} 
          symbol={selectedSymbol} 
          interval={selectedInterval} 
          height={380} 
        />
      </div>

      {/* Multi-Indicator Confluence Checklist Table */}
      <div className="bg-[#121721] border border-[#1E2638] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1E2638] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Technical Confluence Scoring Breakdown</h3>
          <span className="text-xs text-slate-400 font-mono">Total Confluence: {confluence.score}/100</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-[#0B0E14] text-slate-400 uppercase text-[10px] border-b border-[#1E2638]">
              <tr>
                <th className="py-2.5 px-4">Indicator</th>
                <th className="py-2.5 px-4">Value / Metric</th>
                <th className="py-2.5 px-4">Condition</th>
                <th className="py-2.5 px-4">Weight</th>
                <th className="py-2.5 px-4 text-right">Bias Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">EMA 9 / 21 Crossover</td>
                <td className="py-3 px-4 text-blue-400">EMA9: {ema.ema9?.toFixed(1)} | EMA21: {ema.ema21?.toFixed(1)}</td>
                <td className="py-3 px-4">{ema.crossover !== 'NONE' ? ema.crossover : `Trend: ${ema.trend}`}</td>
                <td className="py-3 px-4 text-slate-400">25%</td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ema.trend === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {ema.trend}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Intraday VWAP</td>
                <td className="py-3 px-4 text-amber-400">VWAP: ₹{vwap.vwap?.toFixed(2)}</td>
                <td className="py-3 px-4">{vwap.position.replace('_', ' ')} ({vwap.deviationPercent}%)</td>
                <td className="py-3 px-4 text-slate-400">20%</td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    vwap.position.includes('ABOVE') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {vwap.position.includes('ABOVE') ? 'BULLISH' : 'BEARISH'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">RSI (14 Periods)</td>
                <td className="py-3 px-4 text-purple-400">RSI: {rsi.value}</td>
                <td className="py-3 px-4">{rsi.zone.replace('_', ' ')}</td>
                <td className="py-3 px-4 text-slate-400">20%</td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rsi.value >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {rsi.value >= 50 ? 'BULLISH' : 'BEARISH'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">MACD (12, 26, 9)</td>
                <td className="py-3 px-4 text-white">Line: {macd.macdLine?.toFixed(1)} | Hist: {macd.histogram?.toFixed(1)}</td>
                <td className="py-3 px-4">{macd.momentum.replace('_', ' ')}</td>
                <td className="py-3 px-4 text-slate-400">20%</td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    macd.momentum.includes('BULLISH') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {macd.momentum.includes('BULLISH') ? 'BULLISH' : 'BEARISH'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Volume Spike Confirmation</td>
                <td className="py-3 px-4 text-cyan-400">{volume.spikeRatio}x Relative Volume</td>
                <td className="py-3 px-4">{volume.status.replace('_', ' ')}</td>
                <td className="py-3 px-4 text-slate-400">15%</td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    volume.isSpike ? 'bg-cyan-500/10 text-cyan-400' : 'bg-[#1E2638] text-slate-400'
                  }`}>
                    {volume.isSpike ? 'AMPLIFIED' : 'NORMAL'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
