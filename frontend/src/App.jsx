import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Layers, 
  ShieldCheck, 
  BarChart3, 
  Sparkles,
  Radio,
  ArrowRight,
  Gauge
} from 'lucide-react';
import { io } from 'socket.io-client';
import DashboardOverview from './components/DashboardOverview.jsx';
import LiveMarketView from './components/LiveMarketView.jsx';
import OptionChainView from './components/OptionChainView.jsx';
import TechnicalIndicatorsView from './components/TechnicalIndicatorsView.jsx';
import AiSignalsView from './components/AiSignalsView.jsx';
import PaperTradingView from './components/PaperTradingView.jsx';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastChecked, setLastChecked] = useState(null);
  const [ticks, setTicks] = useState({});
  const [authSession, setAuthSession] = useState(null);

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

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/upstox/status');
      const json = await res.json();
      if (json.success && json.connected) {
        setAuthSession(json.session);
      } else {
        setAuthSession(null);
      }
    } catch (err) {
      console.error('Auth status fetch failed:', err);
    }
  };

  const fetchInitialTicks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/market/feed/ticks');
      const json = await res.json();
      if (json.success && json.data) {
        setTicks(json.data);
      }
    } catch (err) {
      console.error('Ticks fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchAuthStatus();
    fetchInitialTicks();

    // Auto-poll health status every 20 seconds
    const interval = setInterval(() => {
      fetchHealth();
      fetchAuthStatus();
    }, 20000);

    // Socket.io for persistent top ticker across all tabs
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('market:init_ticks', (initialTicks) => {
      if (initialTicks) setTicks(initialTicks);
    });

    socket.on('market:tick', (tick) => {
      if (!tick?.instrumentKey) return;
      setTicks((prev) => ({
        ...prev,
        [tick.instrumentKey]: tick,
      }));
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const niftyTick = ticks['NSE_INDEX|Nifty 50'];
  const bankNiftyTick = ticks['NSE_INDEX|Nifty Bank'];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, status: 'Active (Phase 6)' },
    { id: 'live-market', label: 'Live Market', icon: TrendingUp, status: 'Active (Phase 4)' },
    { id: 'option-chain', label: 'Option Chain', icon: Layers, status: 'Active (Phase 5)' },
    { id: 'indicators', label: 'Indicators', icon: Gauge, status: 'Active (Phase 7)' },
    { id: 'ai-signals', label: 'AI Signals', icon: Sparkles, status: 'Active (Phase 8)' },
    { id: 'paper-trading', label: 'Paper Trading', icon: Activity, status: 'Phase 10' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#1E2638] bg-[#0F141F]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg md:text-xl font-bold tracking-tight text-white">
                TradeMind<span className="text-blue-500">.AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Phase 8 Operational
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI-Powered Derivatives Workstation (NIFTY & BANKNIFTY)
            </p>
          </div>
        </div>

        {/* Persistent Ticker Ribbon & Status Badges */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* NIFTY 50 Top Ticker */}
          <div 
            onClick={() => setActiveTab('live-market')}
            className="cursor-pointer bg-[#121721] hover:bg-[#1A2234] border border-[#1E2638] px-3 py-1.5 rounded-lg hidden sm:flex items-center space-x-2 transition font-mono text-xs"
            title="Click to view full NIFTY 50 Chart"
          >
            <span className="text-slate-400 font-semibold">NIFTY:</span>
            <span className="font-bold text-white">
              {niftyTick?.ltp ? niftyTick.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '24,536.60'}
            </span>
            <span className={`text-[11px] font-medium flex items-center ${
              (niftyTick?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(niftyTick?.change || 0) >= 0 ? '+' : ''}{(niftyTick?.changePercent || 2.35).toFixed(2)}%
            </span>
          </div>

          {/* BANKNIFTY Top Ticker */}
          <div 
            onClick={() => setActiveTab('live-market')}
            className="cursor-pointer bg-[#121721] hover:bg-[#1A2234] border border-[#1E2638] px-3 py-1.5 rounded-lg hidden lg:flex items-center space-x-2 transition font-mono text-xs"
            title="Click to view full BANKNIFTY Chart"
          >
            <span className="text-slate-400 font-semibold">BANKNIFTY:</span>
            <span className="font-bold text-white">
              {bankNiftyTick?.ltp ? bankNiftyTick.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '57,773.65'}
            </span>
            <span className={`text-[11px] font-medium flex items-center ${
              (bankNiftyTick?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(bankNiftyTick?.change || 0) >= 0 ? '+' : ''}{(bankNiftyTick?.changePercent || 3.22).toFixed(2)}%
            </span>
          </div>

          {/* Global Connection Badge */}
          <div className="flex items-center space-x-2 bg-[#121721] px-3 py-1.5 rounded-lg border border-[#1E2638]">
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
            onClick={() => { fetchHealth(); fetchInitialTicks(); }} 
            className="p-2 rounded-lg bg-[#121721] border border-[#1E2638] text-slate-300 hover:text-white hover:bg-[#1A2234] transition flex items-center text-xs gap-1.5"
            title="Refresh System Status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile Horizontal Tabs Row (Visible on small screens) */}
      <div className="flex md:hidden overflow-x-auto border-b border-[#1E2638] bg-[#0E121B] px-3 py-2 space-x-2 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 bg-[#121721] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

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
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Broker Integration</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live V3
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {authSession ? (
                <>
                  <span className="text-white font-semibold">{authSession.userName}</span>
                  <br />
                  <span className="text-slate-500 text-[10px]">UCC: {authSession.userId}</span>
                </>
              ) : (
                'Upstox OAuth 2.0 & Protobuf Feed V3 active.'
              )}
            </p>
          </div>
        </aside>

        {/* Dynamic Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {activeTab === 'live-market' ? (
            <LiveMarketView />
          ) : activeTab === 'option-chain' ? (
            <OptionChainView />
          ) : activeTab === 'indicators' ? (
            <TechnicalIndicatorsView />
          ) : activeTab === 'ai-signals' ? (
            <AiSignalsView 
              onNavigateToMarket={() => setActiveTab('live-market')} 
              onNavigateToPaperTrading={() => setActiveTab('paper-trading')} 
            />
          ) : activeTab === 'paper-trading' ? (
            <PaperTradingView onNavigateToOptionChain={() => setActiveTab('option-chain')} />
          ) : (
            <DashboardOverview 
              healthData={healthData}
              lastChecked={lastChecked}
              error={error}
              onNavigateTab={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
