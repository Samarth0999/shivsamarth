import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Lock, Eye, EyeOff, X, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose, targetUser = null, onSuccess }) {
  const { currentUser, apiFetch, showToast } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isTargetOther = targetUser && targetUser.id !== currentUser?.id;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (!isTargetOther && !currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    setLoading(true);
    try {
      if (isTargetOther) {
        // Super admin changing another staff's password
        const res = await apiFetch(`/api/auth/users/${targetUser.id}/change-password`, {
          method: 'POST',
          body: JSON.stringify({
            new_password: newPassword,
            confirm_password: confirmPassword
          })
        });
        showToast(res.message || `Password updated for ${targetUser.name}!`);
      } else {
        // Staff member changing their own password
        const res = await apiFetch('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
          })
        });
        showToast(res.message || 'Your password has been changed successfully!');
      }

      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    onClose();
  };

  const targetName = isTargetOther ? targetUser?.name : currentUser?.name;
  const targetRole = isTargetOther ? targetUser?.role?.replace('_', ' ') : currentUser?.role?.replace('_', ' ');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-xs ${
            isTargetOther ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {isTargetOther ? `Change Password: ${targetName}` : 'Change Your Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">
            {isTargetOther ? (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Shield className="w-3 h-3" />
                Super Admin Master Reset • {targetRole}
              </span>
            ) : (
              <span>Account: {targetName} ({targetRole})</span>
            )}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Current Password (only required if changing own password) */}
          {!isTargetOther && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {isTargetOther && (
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                As <strong>Super Admin</strong>, you can set a new password directly for this staff member without knowing their current password.
              </span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 4 characters"
                minLength={4}
                required
                className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                minLength={4}
                required
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {newPassword && confirmPassword && (
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                {newPassword === confirmPassword ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold">Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (confirmPassword && newPassword !== confirmPassword)}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isTargetOther ? 'Update Staff Password' : 'Change Password'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
