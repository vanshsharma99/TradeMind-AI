import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  Key, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

export default function BrokerConnectionCard() {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/upstox/status');
      const data = await response.json();
      if (data.success) {
        setAuthStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Upstox auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();

    // Check for callback query parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      const user = urlParams.get('user') || 'Trader';
      setNotification({
        type: 'success',
        message: `Welcome back, ${user}! Upstox session successfully established.`,
      });
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchAuthStatus();
    } else if (urlParams.get('auth_error')) {
      setNotification({
        type: 'error',
        message: `OAuth Error: ${urlParams.get('auth_error')}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Refresh status every 30 seconds
    const interval = setInterval(fetchAuthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLiveLogin = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/upstox/login');
      const data = await res.json();
      if (data.success && data.loginUrl) {
        window.location.href = data.loginUrl;
      } else {
        setNotification({
          type: 'warning',
          message: data.message || 'Upstox credentials not configured. Please add API Key & Secret in backend/.env',
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Network error: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateLogin = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/upstox/mock-login', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: 'Simulated sandbox broker session activated for testing!',
        });
        await fetchAuthStatus();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Sandbox simulation error: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/upstox/logout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'info',
          message: 'Upstox broker session disconnected.',
        });
        await fetchAuthStatus();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Logout failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-[#121721] border border-[#1E2638] rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white">Upstox Broker Connection</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E2638] text-slate-300">
                OAuth 2.0 (Phase 2)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure authentication gateway for live market data feed and options stream
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-2">
          {loading ? (
            <span className="text-xs text-slate-400 inline-flex items-center">
              <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> Checking status...
            </span>
          ) : authStatus?.connected ? (
            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
              authStatus.session?.isSimulated
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <span className={`h-2 w-2 rounded-full mr-1.5 ${
                authStatus.session?.isSimulated ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'
              }`} />
              {authStatus.session?.isSimulated ? 'Sandbox Connected' : 'Broker Connected'}
            </span>
          ) : (
            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3.5 rounded-lg text-xs flex items-center justify-between border ${
          notification.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : notification.type === 'error'
            ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Session Details or Login Actions */}
      {authStatus?.connected && authStatus.session ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Account Details */}
            <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-3.5 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <User className="h-3.5 w-3.5 text-blue-400" />
                <span>Trader Profile</span>
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {authStatus.session.userName}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                UCC: {authStatus.session.userId}
              </div>
            </div>

            {/* Token Expiry */}
            <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-3.5 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Daily Token Expiry</span>
              </div>
              <div className="text-sm font-semibold text-white">
                ~{authStatus.session.remainingHours} hrs left
              </div>
              <div className="text-[11px] text-slate-400">
                Expires 03:30 AM IST
              </div>
            </div>

            {/* Security Isolation */}
            <div className="bg-[#0B0E14] border border-[#1E2638] rounded-lg p-3.5 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Key className="h-3.5 w-3.5 text-emerald-400" />
                <span>Client Security</span>
              </div>
              <div className="text-sm font-semibold text-emerald-400">
                Zero Token Leakage
              </div>
              <div className="text-[11px] text-slate-400">
                Token stored strictly in MongoDB
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Authenticated and ready for Market Data Feed V3 (Phase 3)
            </span>

            <button
              onClick={handleLogout}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{actionLoading ? 'Disconnecting...' : 'Disconnect Broker'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Connect your Upstox Developer account to stream real-time options chain data, live NIFTY ticks, and volume analytics.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live OAuth Login Button */}
            <button
              onClick={handleLiveLogin}
              disabled={actionLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{actionLoading ? 'Connecting...' : 'Connect Upstox Broker'}</span>
            </button>

            {/* Sandbox Simulation Button */}
            <button
              onClick={handleSimulateLogin}
              disabled={actionLoading}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#1E2638] hover:bg-[#28334C] text-slate-200 border border-slate-700/60 text-xs font-medium transition disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Activate Sandbox Session (Test Mode)</span>
            </button>
          </div>

          {/* Config helper notice */}
          {!authStatus?.configured && (
            <div className="flex items-start space-x-2 p-3 rounded-lg bg-[#0E121B] border border-[#1E2638] text-xs text-slate-400">
              <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-medium">Developer Setup Note: </span>
                To use live Upstox OAuth, set <code className="text-blue-400 font-mono">UPSTOX_API_KEY</code> and <code className="text-blue-400 font-mono">UPSTOX_API_SECRET</code> in <code className="text-slate-300 font-mono">backend/.env</code>. For immediate testing, click <strong>Activate Sandbox Session</strong> above.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
