import React, { useState } from 'react';
import {
  ShieldCheck, User, Lock, AlertCircle, ArrowRight,
  X, Eye, EyeOff, KeyRound
} from 'lucide-react';
import { signInWithGoogle } from '../../firebase';

export function StaffLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

      // Store in localStorage with 1-hour session expiration
      const expiresAt = Date.now() + 60 * 60 * 1000;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('auth_expires_at', String(expiresAt));

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      const googleUser = result.user;
      const idToken = await googleUser.getIdToken();

      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleUser.email,
          idToken,
          name: googleUser.displayName,
          photoURL: googleUser.photoURL
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      // Store in localStorage with 1-hour session expiration
      const expiresAt = Date.now() + 60 * 60 * 1000;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('auth_expires_at', String(expiresAt));

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup without signing in
        return;
      }
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative text-slate-900">

        {/* Executive Dark-Plum Brand Header */}
        <div className="bg-gradient-to-br from-[#140d21] via-[#1c1230] to-[#281647] px-6 py-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close portal login"
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-purple-400/25 p-1.5 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src="/images/IMG-20211120-WA0001-removebg-preview.png"
                alt="ShivSamarth Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider text-purple-200 mb-1">
                <ShieldCheck className="w-3 h-3 text-purple-300" />
                <span>ShivSamarth DSMS</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Staff Management Portal
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Authorized multi-branch console sign in
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email, Phone or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter staff email, phone, or username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-purple-200" />
                  <span>Sign In to Staff Portal</span>
                  <ArrowRight className="w-4 h-4 text-purple-200" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 text-slate-400 font-semibold text-[10px] tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Role-based encrypted session</span>
            <span className="font-mono text-slate-500">Shortcut: Ctrl+Shift+S</span>
          </div>
        </div>

      </div>
    </div>
  );
}
