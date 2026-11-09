import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, MapPin, Globe, LogOut, PanelLeftClose, X, KeyRound
} from 'lucide-react';
import { getNavItems } from '../utils/navConfig';
import { ChangePasswordModal } from './ChangePasswordModal';

export function Sidebar() {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    setViewMode, 
    logoutUser, 
    isNavOpen, 
    toggleNavMenu,
    hasPermission 
  } = useApp();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const isInstructor = currentUser?.role === 'instructor';
  const currentNav = getNavItems({ currentUser, hasPermission });

  return (
    <>
      {/* Mobile Backdrop when menu is open */}
      {isNavOpen && (
        <div 
          onClick={toggleNavMenu}
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-xs md:hidden"
          title="Click to close navigation menu"
        />
      )}

      <aside className={`
        ${isNavOpen 
          ? 'w-64 opacity-100 translate-x-0' 
          : 'w-0 opacity-0 -translate-x-full md:translate-x-0 overflow-hidden border-0 p-0 pointer-events-none'
        }
        transition-all duration-300 ease-in-out bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800
        fixed md:static inset-y-0 left-0 z-50 md:z-auto h-full
      `}>
        
        {/* User Badge Banner */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-semibold text-sm text-white truncate">{currentUser?.name}</h3>
                <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  {currentUser?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Close Navigation Button */}
            <button
              type="button"
              onClick={toggleNavMenu}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Close Navigation Menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            {currentUser?.branch_name ? (
              <div className="flex-1 px-2 py-1 rounded bg-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1 border border-slate-700/50 truncate min-w-0">
                <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">{currentUser.branch_name}</span>
              </div>
            ) : (
              <div className="flex-1 text-[11px] text-slate-500 font-mono">
                HQ Consolidated
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 border border-amber-500/30 transition-colors shrink-0 cursor-pointer"
              title="Change your login password"
            >
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>Password</span>
            </button>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{isInstructor ? 'Instructor Console' : 'Navigation Menu'}</span>
          </div>

          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  // On mobile screen auto-close after clicking
                  if (window.innerWidth < 768) {
                    toggleNavMenu();
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Public Site Link & Sign Out */}
        <div className="p-3 border-t border-slate-800/80 space-y-1.5 bg-slate-950/20">
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-amber-300 text-[11px] font-semibold border border-slate-700/60 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>Change My Password</span>
          </button>
          <button
            onClick={() => setViewMode('landing')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/25 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>View Public Website ↗</span>
          </button>
          <button
            onClick={logoutUser}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-400 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Exit Portal (Sign Out)</span>
          </button>
        </div>

        {/* System Status Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Branch Sync Active
          </span>
          <span className="font-mono text-slate-400">v2.4 Pro</span>
        </div>

      </aside>

      {/* Change Password Modal for logged-in user */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
