import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, Shield, MapPin, User, ChevronDown, Bell, Car, 
  CheckCircle, X, ExternalLink, AlertTriangle, Phone, Globe,
  Menu, PanelLeftClose, LayoutGrid, KeyRound, LogOut, Mail
} from 'lucide-react';
import { getNavItems } from '../utils/navConfig';
import { ChangePasswordModal } from './ChangePasswordModal';

export function Header({ onOpenStudentModal }) {
  const { 
    currentUser, 
    hasPermission,
    isNavOpen,
    toggleNavMenu,
    activeTab,
    setActiveTab,
    usersList, 
    branches, 
    selectedBranchId, 
    setSelectedBranchId, 
    settings, 
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
  const [showQuickTabs, setShowQuickTabs] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const searchRef = useRef(null);
  const personaRef = useRef(null);
  const quickTabsRef = useRef(null);

  const navItems = getNavItems({ currentUser, hasPermission });

  // Close menus on outside click
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

  // Global Alt+T Keyboard Shortcut to toggle Quick Tabs popover
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

  // Rapid 1-9 Number Navigation when Quick Tabs popover is open
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

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Toggle Navigation Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleNavMenu}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
              isNavOpen 
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' 
                : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 shadow-xs'
            }`}
            title={isNavOpen ? "Close Navigation Menu (Hide Sidebar)" : "Open Navigation Menu (Show Sidebar)"}
          >
            {isNavOpen ? <PanelLeftClose className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-blue-600" />}
            <span className="text-xs font-bold hidden sm:inline">
              {isNavOpen ? "Close Menu" : "Open Menu"}
            </span>
          </button>

          {/* Quick Tab Switcher Shortcut Button (Visible when Navigation Menu is closed) */}
          {!isNavOpen && (
            <div className="relative" ref={quickTabsRef}>
              <button
                type="button"
                onClick={() => setShowQuickTabs(prev => !prev)}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center gap-2 shadow-xs ${
                  showQuickTabs
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800 hover:border-slate-700'
                }`}
                title="Quick Tabs Access (Shortcut: Alt+T, then 1-9)"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold hidden xs:inline">Quick Tabs</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-white/10 text-white border border-white/15 hidden md:inline">
                  Alt+T
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickTabs ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Quick Tabs Dropdown Popover */}
              {showQuickTabs && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                        Quick Tab Switcher
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Press 1-9 to jump directly</p>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      Esc
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
                    {navItems.map((item, idx) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const numberKey = idx < 9 ? idx + 1 : null;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setShowQuickTabs(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs font-bold'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive 
                                ? 'bg-white/20 text-white' 
                                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {item.badge && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                isActive ? 'bg-blue-500 text-white' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            {numberKey && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                              }`}>
                                {numberKey}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="w-10 h-10 rounded-xl bg-purple-900/10 border border-amber-400/40 p-1 flex items-center justify-center shadow-xs">
            <img
              src="/images/IMG-20211120-WA0001-removebg-preview.png"
              alt="ShivSamarth Logo"
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.src = '/images/driving_school.png'; }}
            />
          </div>
          <div>
            <span className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
              {settings.app_name || 'ShivSamarth'}
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                DRIVE OS
              </span>
            </span>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Motor Driving School • Beed (MH-23)</p>
          </div>
        </div>

        {/* Global Universal Search Bar (Module 1) */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="🔍 Search by Name, Phone, or Enroll ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Search Results Floating Dropdown */}
          {showSearchResults && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>Matching Results</span>
                {isSearching && <span>Searching...</span>}
              </div>

              {/* Students Match */}
              {searchResults.students?.length > 0 && (
                <div className="p-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Students</div>
                  {searchResults.students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveTab('students');
                        setShowSearchResults(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-blue-50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          {s.name}
                          <span className="text-xs font-mono font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {s.enroll_id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {s.phone}</span>
                          <span>•</span>
                          <span>{s.branch_name}</span>
                          <span>•</span>
                          <span>Day {s.days_completed}/{s.total_course_days}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.pending_balance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {s.pending_balance > 0 ? `₹${s.pending_balance} due` : 'Paid'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Vehicles Match */}
              {searchResults.vehicles?.length > 0 && (
                <div className="p-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Vehicles</div>
                  {searchResults.vehicles.map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setActiveTab('batches');
                        setShowSearchResults(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-blue-600" />
                        {v.model} ({v.reg_number})
                      </div>
                      <span className="text-slate-500">{v.branch_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Staff Match */}
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
          )}
        </div>

        {/* Right Section: Branch Selector & Persona Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Branch Selector (Super Admin: Dropdown; Staff: Static Badge) */}
          {isSuperAdmin ? (
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
                className="pl-8 pr-7 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">🏢 All Branches (Consolidated)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentUser?.branch_name || 'Branch'}</span>
            </div>
          )}

          {/* User Account Profile Menu */}
          <div ref={personaRef} className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 p-1.5 pr-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title={`Logged in as ${currentUser?.name}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                currentUser?.role === 'super_admin' ? 'bg-amber-600' :
                currentUser?.role === 'branch_manager' ? 'bg-blue-600' :
                currentUser?.role === 'instructor' ? 'bg-emerald-600' : 'bg-purple-600'
              }`}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-none">
                  {currentUser?.name?.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-500 capitalize leading-tight">
                  {currentUser?.role?.replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Account Details & Actions Dropdown */}
            {showPersonaMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fade-in">
                {/* Account Profile Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                      currentUser?.role === 'super_admin' ? 'bg-amber-600' :
                      currentUser?.role === 'branch_manager' ? 'bg-blue-600' :
                      currentUser?.role === 'instructor' ? 'bg-emerald-600' : 'bg-purple-600'
                    }`}>
                      {currentUser?.name?.charAt(0) || 'U'}
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold capitalize bg-white border border-slate-200 text-slate-700">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        currentUser?.role === 'super_admin' ? 'bg-amber-500' :
                        currentUser?.role === 'branch_manager' ? 'bg-blue-500' :
                        currentUser?.role === 'instructor' ? 'bg-emerald-500' : 'bg-purple-500'
                      }`} />
                      {currentUser?.role?.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500 truncate max-w-[120px]">
                      {currentUser?.branch_name || 'All Branches'}
                    </span>
                  </div>
                </div>

                {/* Account Action Buttons */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPersonaMenu(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Change My Password</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Security</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPersonaMenu(false);
                      logoutUser();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Switch to Public Website */}
          <button
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-xs"
            title="Switch to Public Landing Website"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Public Site ↗</span>
          </button>

        </div>

      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
}
