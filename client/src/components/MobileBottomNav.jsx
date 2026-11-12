import React from 'react';
import {
  LayoutGrid, UserPlus, Users, Receipt, Menu,
  CheckSquare, MapPin, Wallet, AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Thumb-friendly bottom navigation bar rendered on mobile viewports (< md).
 */
export function MobileBottomNav() {
  const { currentUser, activeTab, setActiveTab, toggleNavMenu, isNavOpen } = useApp();
  const isInstructor = currentUser?.role === 'instructor';

  const tabs = isInstructor
    ? [
        { id: 'instructor', label: 'Register', icon: CheckSquare },
        { id: 'instructor-checkin', label: 'GPS', icon: MapPin },
        { id: 'instructor-wages', label: 'Wages', icon: Wallet },
        { id: 'instructor-reminders', label: 'Alerts', icon: AlertTriangle }
      ]
    : [
        { id: 'dashboard', label: 'Home', icon: LayoutGrid },
        { id: 'leads', label: 'Leads', icon: UserPlus },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'payments', label: 'Fees', icon: Receipt }
      ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_20px_-6px_rgba(15,23,42,0.12)]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id && !isNavOpen;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              isActive ? 'text-purple-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-purple-50' : ''}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`text-[10px] mt-0.5 leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={toggleNavMenu}
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors cursor-pointer ${
          isNavOpen ? 'text-purple-700' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <div className={`p-1 rounded-lg ${isNavOpen ? 'bg-purple-50' : ''}`}>
          <Menu className="w-4 h-4" />
        </div>
        <span className={`text-[10px] mt-0.5 leading-none ${isNavOpen ? 'font-bold' : 'font-medium'}`}>
          More
        </span>
      </button>
    </nav>
  );
}

