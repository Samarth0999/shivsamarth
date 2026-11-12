import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, Building2, Bell, Car, X, Phone, Globe, Menu,
  LayoutGrid, KeyRound, LogOut, Mail
} from 'lucide-react';
import { getNavItems, getNavSections } from '../utils/navConfig';
import { ChangePasswordModal } from './ChangePasswordModal';

function getInitials(name) {
  if (!name) return 'SA';
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || 'SA';
}

export function Header() {
  const {
    currentUser,
    hasPermission,
    isNavOpen,
    toggleNavMenu,
    activeTab,
    setActiveTab,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    performSearch,
    setViewMode,
    logoutUser
  } = useApp();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showQuickTabs, setShowQuickTabs] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const searchRef = useRef(null);
  const personaRef = useRef(null);
  const quickTabsRef = useRef(null);

  const navItems = getNavItems({ currentUser, hasPermission });
  const navSections = getNavSections({ currentUser, hasPermission });
  const isInstructor = currentUser?.role === 'instructor';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const initials = getInitials(currentUser?.name);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (personaRef.current && !personaRef.current.contains(event.target)) {
        setShowPersonaMenu(false);
      }
      if (quickTabsRef.current && !quickTabsRef.current.contains(event.target)) {
        setShowQuickTabs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setShowQuickTabs(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showQuickTabs) return;
    function handleNumberNav(e) {
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= navItems.length) {
        e.preventDefault();
        const target = navItems[num - 1];
        if (target) {
          setActiveTab(target.id);
          setShowQuickTabs(false);
        }
      }
      if (e.key === 'Escape') {
        setShowQuickTabs(false);
      }
    }
    window.addEventListener('keydown', handleNumberNav);
    return () => window.removeEventListener('keydown', handleNumberNav);
  }, [showQuickTabs, navItems, setActiveTab]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    performSearch(val);
    setShowSearchResults(true);
  };

  const searchResultsDropdown = showSearchResults && searchResults && (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
      <div className="p-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500 font-medium">
        <span>Matching Results</span>
        {isSearching && <span>Searching...</span>}
      </div>

      {searchResults.students?.length > 0 && (
        <div className="p-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Students</div>
          {searchResults.students.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveTab('students');
                setShowSearchResults(false);
                setShowMobileSearch(false);
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-purple-50 flex items-center justify-between gap-2 group transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs font-mono font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {s.enroll_id}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {s.phone}</span>
                  <span>•</span>
                  <span>{s.branch_name}</span>
                  <span>•</span>
                  <span>Day {s.days_completed}/{s.total_course_days}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.pending_balance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {s.pending_balance > 0 ? `₹${s.pending_balance} due` : 'Paid'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchResults.vehicles?.length > 0 && (
        <div className="p-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Vehicles</div>
          {searchResults.vehicles.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActiveTab('batches');
                setShowSearchResults(false);
                setShowMobileSearch(false);
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-purple-600" />
                {v.model} ({v.reg_number})
              </div>
              <span className="text-slate-500">{v.branch_name}</span>
            </button>
          ))}
        </div>
      )}

      {searchResults.staff?.length > 0 && (
        <div className="p-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Staff</div>
          {searchResults.staff.map(u => (
            <div key={u.id} className="p-2 rounded-lg text-xs flex items-center justify-between">
              <span className="font-medium text-slate-800">{u.name} ({u.role.replace('_', ' ')})</span>
              <span className="text-slate-500">{u.phone}</span>
            </div>
          ))}
        </div>
      )}

      {searchResults.students?.length === 0 && searchResults.vehicles?.length === 0 && (
        <div className="p-6 text-center text-sm text-slate-500">
          No records found matching "{searchQuery}"
        </div>
      )}
    </div>
  );

  return (
    <header ref={searchRef} className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shrink-0">
      <div className="h-14 sm:h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">

      {/* Left: Mobile / Collapsed Sidebar Trigger & Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="relative" ref={quickTabsRef}>
          <button
            type="button"
            onClick={toggleNavMenu}
            className={`${isNavOpen ? 'md:hidden' : 'flex'} w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 items-center justify-center transition-colors cursor-pointer shrink-0`}
            title={isNavOpen ? 'Close Sidebar' : 'Open Sidebar'}
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Quick Tab Switcher Popover (Alt+T) */}
          {showQuickTabs && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
                    Quick Tab Switcher
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">Press 1–9 to jump directly</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  Esc
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto py-1 space-y-2">
                {navSections.map((section, sectionIdx) => {
                  const startIdx = navSections
                    .slice(0, sectionIdx)
                    .reduce((sum, prev) => sum + prev.items.length, 0);

                  return (
                    <div
                      key={section.id}
                      className={`space-y-0.5 ${sectionIdx > 0 ? 'pt-2 border-t border-slate-100' : ''}`}
                    >
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {section.title}
                      </div>

                      {section.items.map((item, itemIdx) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const globalIdx = startIdx + itemIdx;
                        const numberKey = globalIdx < 9 ? globalIdx + 1 : null;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              setShowQuickTabs(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group cursor-pointer ${
                              isActive
                                ? 'bg-purple-600 text-white font-bold'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="truncate">{item.label}</span>
                            </div>

                            {numberKey && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ml-2 ${
                                isActive ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                              }`}>
                                {numberKey}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => setShowMobileSearch(prev => !prev)}
          className={`sm:hidden w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            showMobileSearch
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Search"
          aria-label="Toggle Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Mobile Brand Label (compact) */}
        <span className="sm:hidden font-bold text-sm text-slate-900 truncate">
          Shivsamarth
        </span>

        {/* Universal Search Bar (Desktop / Tablet inline) */}
        <div className="relative hidden sm:block flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students, leads, vehicles..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(true)}
              className="w-full h-10 pl-10 pr-8 bg-slate-50/90 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200/90 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchResultsDropdown}
        </div>
      </div>

      {/* Right: Branch Selector, Alert Bell & User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

        {/* Branch Selector */}
        {isSuperAdmin ? (
          <div className="relative flex items-center">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 absolute left-2.5 sm:left-3 pointer-events-none" />
            <select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
              className="h-9 sm:h-10 pl-8 sm:pl-9 pr-6 sm:pr-7 text-[11px] sm:text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 cursor-pointer whitespace-nowrap max-w-[125px] sm:max-w-[180px]"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="h-9 sm:h-10 flex items-center gap-1.5 px-2.5 sm:px-3 bg-white text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 whitespace-nowrap">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
            <span className="hidden sm:inline">{currentUser?.branch_name || 'Branch'}</span>
          </div>
        )}

        {/* Notifications / Risk Alerts Button */}
        <button
          type="button"
          onClick={() => setActiveTab(isInstructor ? 'instructor-reminders' : 'risk')}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          title="View Risk Matrix & Day 10 Alerts"
          aria-label="View Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Avatar & Dropdown */}
        <div ref={personaRef} className="relative">
          <button
            type="button"
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold text-xs flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
            title={`${currentUser?.name || 'User'} — Account Menu`}
            aria-label="Account Menu"
          >
            {initials}
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {initials}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {currentUser?.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{currentUser?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold capitalize bg-white border border-slate-200 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    {currentUser?.role?.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500 truncate max-w-[120px]">
                    {currentUser?.branch_name || 'All Branches'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonaMenu(false);
                    setViewMode('landing');
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span>View Public Website</span>
                  </span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPersonaMenu(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Change Password</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Security</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPersonaMenu(false);
                    logoutUser();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      </div>

      {/* Expandable Full-Width Search Row on Mobile */}
      {showMobileSearch && (
        <div className="sm:hidden px-3 pb-3 pt-1 border-t border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students, leads, vehicles..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(true)}
              autoFocus
              className="w-full h-10 pl-9 pr-9 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setShowMobileSearch(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            {searchResultsDropdown}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
}
