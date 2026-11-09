import React, { useState } from 'react';
import { Shield, Key, User, Lock, AlertCircle, ArrowRight, X } from 'lucide-react';

export function StaffLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      // Store in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Shield */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-slate-600 border border-slate-200 mb-2">
            <span>Shortcut: Ctrl + Shift + S</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Staff Management Portal</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ShivSamarth Motor Driving School • System Access
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email, Phone or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter staff email, phone, or username"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4 text-amber-400" />
                <span>Authenticate & Access Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
