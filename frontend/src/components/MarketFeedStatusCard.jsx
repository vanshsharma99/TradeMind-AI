import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Radio, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Cpu, 
  Layers, 
  Zap, 
  Clock, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

export default function MarketFeedStatusCard() {
  const [socketConnected, setSocketConnected] = useState(false);
  const [feedStatus, setFeedStatus] = useState(null);
  const [ticks, setTicks] = useState({});
  const [lastTickFlash, setLastTickFlash] = useState({});

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('feed:status', (status) => {
      setFeedStatus(status);
    });

    socket.on('market:init_ticks', (initialTicks) => {
      setTicks(initialTicks || {});
    });

    socket.on('market:tick', (tick) => {
      if (!tick?.instrumentKey) return;

      setTicks((prev) => {
        const prevTick = prev[tick.instrumentKey];
        const flash = tick.ltp >= (prevTick?.ltp || tick.ltp) ? 'up' : 'down';

        setLastTickFlash((prevFlash) => ({
          ...prevFlash,
          [tick.instrumentKey]: flash,
        }));

        // Reset flash state after 400ms
        setTimeout(() => {
          setLastTickFlash((prevFlash) => ({
            ...prevFlash,
            [tick.instrumentKey]: null,
          }));
        }, 400);

        return {
          ...prev,
          [tick.instrumentKey]: tick,
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const niftyTick = ticks['NSE_INDEX|Nifty 50'];
  const bankNiftyTick = ticks['NSE_INDEX|Nifty Bank'];

  return (
    <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <Radio className="h-5 w-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white">Upstox Market Data Feed V3 (Protobuf)</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E2638] text-slate-300">
                Phase 3 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-frequency binary WebSocket stream decoded with Google Protocol Buffers
            </p>
          </div>
        </div>

        {/* Telemetry Status Badges */}
        <div className="flex items-center space-x-2">
          {socketConnected ? (
            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              WebSocket Active
            </span>
          ) : (
            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <WifiOff className="h-3 w-3 mr-1.5" />
              Socket Connecting...
            </span>
          )}

          {feedStatus?.isSimulated ? (
            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Sandbox Stream (1 Hz)
            </span>
          ) : (
            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
              Live NSE Stream (V3)
            </span>
          )}
        </div>
      </div>

      {/* Live Indices Ticker Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NIFTY 50 Stream Card */}
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-wide">NIFTY 50</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1E2638] text-slate-400">
                NSE_INDEX
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Close: <span className="font-mono text-slate-300">{niftyTick?.closePrice?.toFixed(2) || '24,480.00'}</span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <div className={`text-xl font-extrabold font-mono transition-colors duration-300 ${
              lastTickFlash['NSE_INDEX|Nifty 50'] === 'up'
                ? 'text-emerald-400 scale-105'
                : lastTickFlash['NSE_INDEX|Nifty 50'] === 'down'
                ? 'text-rose-400 scale-105'
                : 'text-white'
            }`}>
              {niftyTick?.ltp ? niftyTick.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '24,530.50'}
            </div>
            <div className={`text-xs font-mono font-medium flex items-center justify-end space-x-1 ${
              (niftyTick?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(niftyTick?.change || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>
                {(niftyTick?.change || 0) >= 0 ? '+' : ''}{niftyTick?.change?.toFixed(2) || '+50.50'}
              </span>
              <span>
                ({(niftyTick?.changePercent || 0) >= 0 ? '+' : ''}{niftyTick?.changePercent?.toFixed(2) || '+0.21'}%)
              </span>
            </div>
          </div>
        </div>

        {/* BANKNIFTY Stream Card */}
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-wide">BANKNIFTY</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1E2638] text-slate-400">
                NSE_INDEX
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Close: <span className="font-mono text-slate-300">{bankNiftyTick?.closePrice?.toFixed(2) || '52,050.00'}</span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <div className={`text-xl font-extrabold font-mono transition-colors duration-300 ${
              lastTickFlash['NSE_INDEX|Nifty Bank'] === 'up'
                ? 'text-emerald-400 scale-105'
                : lastTickFlash['NSE_INDEX|Nifty Bank'] === 'down'
                ? 'text-rose-400 scale-105'
                : 'text-white'
            }`}>
              {bankNiftyTick?.ltp ? bankNiftyTick.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '52,180.25'}
            </div>
            <div className={`text-xs font-mono font-medium flex items-center justify-end space-x-1 ${
              (bankNiftyTick?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(bankNiftyTick?.change || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>
                {(bankNiftyTick?.change || 0) >= 0 ? '+' : ''}{bankNiftyTick?.change?.toFixed(2) || '+130.25'}
              </span>
              <span>
                ({(bankNiftyTick?.changePercent || 0) >= 0 ? '+' : ''}{bankNiftyTick?.changePercent?.toFixed(2) || '+0.25'}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Architecture Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-3">
          <div className="text-slate-500 mb-1">Decoder Engine</div>
          <div className="font-mono font-medium text-slate-200">Google Protobuf V3</div>
        </div>
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-3">
          <div className="text-slate-500 mb-1">Stream Transport</div>
          <div className="font-mono font-medium text-slate-200">Binary WebSocket</div>
        </div>
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-3">
          <div className="text-slate-500 mb-1">Active Subscriptions</div>
          <div className="font-mono font-medium text-blue-400">{feedStatus?.subscribedCount || 2} Instruments</div>
        </div>
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-3">
          <div className="text-slate-500 mb-1">Stream Frequency</div>
          <div className="font-mono font-medium text-emerald-400">1000 ms (Real-time)</div>
        </div>
      </div>
    </div>
  );
}
