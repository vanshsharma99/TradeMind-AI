import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  BarChart3, 
  Clock, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const json = await response.json();
      setHealthData(json.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto-poll health status every 15 seconds
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, status: 'Active (Phase 1)' },
    { id: 'live-market', label: 'Live Market', icon: TrendingUp, status: 'Phase 3-4' },
    { id: 'option-chain', label: 'Option Chain', icon: Layers, status: 'Phase 5' },
    { id: 'ai-signals', label: 'AI Signals', icon: Sparkles, status: 'Phase 8' },
    { id: 'paper-trading', label: 'Paper Trading', icon: Activity, status: 'Phase 10' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#1E2638] bg-[#0F141F]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">TradeMind<span className="text-blue-500">.AI</span></span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Phase 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-400">AI-Powered Options Trading & Quantitative Analytics</p>
          </div>
        </div>

        {/* Global Connection Badge */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-[#121721] px-3 py-1.5 rounded-lg border border-[#1E2638]">
            <span className="text-xs text-slate-400">Backend Status:</span>
            {loading && !healthData ? (
              <span className="inline-flex items-center text-xs text-amber-400">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Checking
              </span>
            ) : healthData ? (
              <span className="inline-flex items-center text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Operational
              </span>
            ) : (
              <span className="inline-flex items-center text-xs text-rose-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500 mr-1.5" />
                Offline
              </span>
            )}
          </div>

          <button 
            onClick={fetchHealth} 
            className="p-2 rounded-lg bg-[#121721] border border-[#1E2638] text-slate-300 hover:text-white hover:bg-[#1A2234] transition flex items-center text-xs gap-1.5"
            title="Refresh Health"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#1E2638] bg-[#0E121B] p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-blue-700/60 text-blue-100' : 'bg-[#1E2638] text-slate-400'
                  }`}>
                    {item.status.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Upstox Info Box */}
          <div className="p-3.5 rounded-xl bg-[#121721] border border-[#1E2638] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Upstox V3 Integration</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scheduled for Phase 2 (OAuth 2.0) and Phase 3 (Market Data Feed V3 Protobuf).
            </p>
          </div>
        </aside>

        {/* Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* Welcome Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#121829] to-[#0E121B] border border-blue-900/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
                <Sparkles className="h-3 w-3" />
                <span>Phase 1 Initialized: Core Architecture & Health Engine</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome to TradeMind AI
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
                A quantitative options analysis and decision-support workstation engineered for Indian derivatives (NIFTY & BANKNIFTY). Deterministic analytics, Protobuf live market streaming, and AI-assisted trade insights.
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono text-xs text-slate-400">
              <div>Environment: <span className="text-emerald-400 font-semibold">{healthData?.environment || 'development'}</span></div>
              <div>Last ping: <span className="text-slate-300">{lastChecked || 'Waiting for check...'}</span></div>
            </div>
          </div>

          {/* Quick Metrics & System Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Backend Service Card */}
            <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Backend Gateway</span>
                <Server className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-white font-mono">
                  {healthData ? 'Port 5000' : 'Offline'}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  healthData ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {healthData ? 'Active' : 'Unreachable'}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
                <span>Node.js:</span>
                <span className="font-mono text-slate-300">{healthData?.system?.nodeVersion || 'N/A'}</span>
              </div>
            </div>

            {/* MongoDB Database Card */}
            <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Database (MongoDB)</span>
                <Database className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-white font-mono">
                  {healthData?.database?.connected ? 'Connected' : 'Connecting'}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  healthData?.database?.connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {healthData?.database?.status || 'Unknown'}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
                <span>Instance:</span>
                <span className="font-mono text-slate-300">127.0.0.1:27017</span>
              </div>
            </div>

            {/* System Memory & Uptime */}
            <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Process Telemetry</span>
                <Cpu className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-white font-mono">
                  {healthData?.system?.memoryUsageMB ? `${healthData.system.memoryUsageMB} MB` : '--'}
                </span>
                <span className="text-xs text-slate-400">Heap</span>
              </div>
              <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
                <span>Uptime:</span>
                <span className="font-mono text-slate-300">
                  {healthData?.uptimeSeconds !== undefined ? `${healthData.uptimeSeconds}s` : '--'}
                </span>
              </div>
            </div>

            {/* Target Instruments */}
            <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Target Indices</span>
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded bg-[#1A2234] text-xs font-mono font-medium text-slate-200">
                  NIFTY 50
                </span>
                <span className="px-2 py-1 rounded bg-[#1A2234] text-xs font-mono font-medium text-slate-200">
                  BANKNIFTY
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
                <span>Stream Protocol:</span>
                <span className="font-mono text-blue-400 font-medium">V3 Protobuf</span>
              </div>
            </div>
          </div>

          {/* Health Diagnostics Output / Details */}
          <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <h2 className="text-base font-semibold text-white">Backend Health Diagnostics Endpoint</h2>
                <code className="text-xs font-mono bg-[#1E2638] px-2 py-0.5 rounded text-blue-400">
                  GET /api/health
                </code>
              </div>
              <span className="text-xs text-slate-500">Auto-refreshing every 15s</span>
            </div>

            {error ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Backend Unreachable</div>
                  <div className="text-xs text-rose-300/80 mt-1">{error}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    Ensure the Express server is running on port 5000 (<code className="text-slate-300 font-mono">npm run dev</code> inside <code className="text-slate-300 font-mono">backend/</code>).
                  </div>
                </div>
              </div>
            ) : healthData ? (
              <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-4 font-mono text-xs overflow-x-auto text-emerald-400">
                <pre>{JSON.stringify(healthData, null, 2)}</pre>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                Fetching backend status...
              </div>
            )}
          </div>

          {/* Roadmap & Phases Checklist */}
          <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Project Implementation Roadmap</h2>
              <span className="text-xs text-slate-400">11 Controlled Incremental Phases</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { phase: 'Phase 1', title: 'Project Setup & Health Verification', status: 'completed', desc: 'MERN scaffold, Express health check, Tailwind UI' },
                { phase: 'Phase 2', title: 'Upstox OAuth 2.0 Authentication', status: 'next', desc: 'Secure token exchange, session storage, refresh cycles' },
                { phase: 'Phase 3', title: 'Upstox Market Data Feed V3', status: 'pending', desc: 'WebSocket connection, Protobuf schema decoder' },
                { phase: 'Phase 4', title: 'Live NIFTY Market Data Streaming', status: 'pending', desc: 'Tick decoding, real-time broadcasting to client' },
                { phase: 'Phase 5', title: 'Option Chain Integration', status: 'pending', desc: 'Greeks, PCR, strike-wise Open Interest analysis' },
                { phase: 'Phase 6', title: 'TradingView Charts & Full UI', status: 'pending', desc: 'Lightweight charts, orderbook depth, dark theme UI' },
                { phase: 'Phase 7', title: 'Technical Indicators (Python/JS)', status: 'pending', desc: 'RSI, EMA 9/21, VWAP, MACD, Volume Profile' },
                { phase: 'Phase 8', title: 'AI Decision Engine', status: 'pending', desc: 'Deterministic signal rules + AI contextual explanations' },
                { phase: 'Phase 9', title: 'Backtesting Engine', status: 'pending', desc: 'Historical simulation and win-rate validation' },
                { phase: 'Phase 10', title: 'Paper Trading Engine', status: 'pending', desc: 'Virtual portfolio, simulated fills, slippage, PnL' },
                { phase: 'Phase 11', title: 'Optimization & Security Hardening', status: 'pending', desc: 'Rate limiting, monitoring, deployment readiness' },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-lg border text-left transition ${
                    item.status === 'completed' 
                      ? 'bg-emerald-950/20 border-emerald-500/30' 
                      : item.status === 'next' 
                      ? 'bg-blue-950/30 border-blue-500/40 ring-1 ring-blue-500/30' 
                      : 'bg-[#0E121B] border-[#1E2638] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-semibold text-slate-300">{item.phase}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                      item.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status === 'next'
                        ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
