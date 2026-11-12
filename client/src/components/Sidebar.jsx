import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LogOut, PanelLeftClose, ChevronRight
} from 'lucide-react';
import { getNavSections } from '../utils/navConfig';
import { ChangePasswordModal } from './ChangePasswordModal';

function getInitials(name) {
  if (!name) return 'SA';
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || 'SA';
}

export function Sidebar() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    logoutUser,
    isNavOpen,
    toggleNavMenu,
    hasPermission
  } = useApp();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const isInstructor = currentUser?.role === 'instructor';
  const navSections = getNavSections({ currentUser, hasPermission });
  const initials = getInitials(currentUser?.name);

  return (
    <>
      {/* Mobile Backdrop when menu is open */}
      {isNavOpen && (
        <div
          onClick={toggleNavMenu}
          className="fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs md:hidden"
          title="Click to close navigation menu"
        />
      )}

      <aside className={`
        ${isNavOpen
          ? 'w-60 opacity-100 translate-x-0'
          : 'w-0 opacity-0 -translate-x-full md:translate-x-0 overflow-hidden border-0 p-0 pointer-events-none'
        }
        transition-all duration-300 ease-in-out bg-[#140d21] text-slate-300 flex flex-col shrink-0 border-r border-white/10
        fixed md:static inset-y-0 left-0 z-50 md:z-auto h-full
      `}>

        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-white/8 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#201636] border border-purple-500/25 p-1 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src="/images/IMG-20211120-WA0001-removebg-preview.png"
                alt="Shivsamarth Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = '/images/driving_school.png'; }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white leading-tight truncate">
                Shivsamarth
              </div>
              <div className="text-[11px] font-medium text-purple-400 leading-tight truncate">
                Management System
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleNavMenu}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Categorized Navigation Menu */}
        <nav
          className="flex-1 px-3 py-4 space-y-5 overflow-y-auto sidebar-scroll"
          aria-label={isInstructor ? 'Instructor Console' : 'Navigation Menu'}
        >
          {navSections.map((section) => (
            <div key={section.id} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 768) {
                        toggleNavMenu();
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-700/80 via-purple-600/55 to-fuchsia-600/35 text-white font-semibold border border-purple-400/25 shadow-md shadow-purple-950/60'
                        : 'text-slate-300/80 hover:text-white hover:bg-white/[0.06] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-200' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-3 border-t border-white/10 bg-[#100a1b] space-y-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
            title="Click to update password"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.name || 'Shivsamarth Staff'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Authorized Portal
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={logoutUser}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
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
