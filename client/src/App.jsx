import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LeadsView } from './components/LeadsView';
import { StudentsView } from './components/StudentsView';
import { InstructorView } from './components/InstructorView';
import { BatchesView } from './components/BatchesView';
import { AttendanceView } from './components/AttendanceView';
import { RiskMatrixView } from './components/RiskMatrixView';
import { ExpensesView } from './components/ExpensesView';
import { PayrollView } from './components/PayrollView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LandingPage } from './components/landing/LandingPage';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { getNavItems } from './utils/navConfig';

function MainApp() {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    toast, 
    setViewMode, 
    isNavOpen, 
    toggleNavMenu, 
    hasPermission 
  } = useApp();
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);

  const isInstructor = currentUser?.role === 'instructor';
  const availableNavItems = getNavItems({ currentUser, hasPermission });

  // Keyboard shortcut Ctrl+Shift+S inside staff portal to toggle back to landing
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setViewMode('landing');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setViewMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border bg-slate-900 text-white text-xs font-semibold animate-slide-up">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Bar with Universal Search, Persona Switcher & Website Link */}
      <Header onOpenStudentModal={() => setIsAdmissionModalOpen(true)} />

      {/* Quick Tab Shortcut Strip when Sidebar is Closed */}
      {!isNavOpen && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 shadow-xs z-30 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar scroll-smooth">
              {availableNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs shadow-blue-600/30 ring-2 ring-blue-600/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.shortLabel || item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        isActive ? 'bg-blue-500 text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="shrink-0 hidden md:flex items-center gap-2">
              <button
                onClick={toggleNavMenu}
                className="text-[11px] font-bold text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                title="Expand Navigation Menu Sidebar"
              >
                <span>Expand Sidebar ⇥</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* If Role is Instructor, always render Instructor Mobile Interface */}
          {isInstructor ? (
            <InstructorView />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard onOpenAdmission={() => setIsAdmissionModalOpen(true)} />}
              {activeTab === 'leads' && (
                <LeadsView onConvertSuccess={() => setActiveTab('students')} />
              )}
              {activeTab === 'students' && (
                <StudentsView 
                  isAdmissionModalOpen={isAdmissionModalOpen} 
                  setIsAdmissionModalOpen={setIsAdmissionModalOpen} 
                />
              )}
              {activeTab === 'batches' && <BatchesView />}
              {activeTab === 'attendance' && <AttendanceView />}
              {activeTab === 'risk' && <RiskMatrixView />}
              {activeTab === 'expenses' && <ExpensesView />}
              {activeTab === 'payroll' && <PayrollView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'settings' && <SettingsView />}
            </>
          )}

        </main>

      </div>

    </div>
  );
}

function AppRouter() {
  const { viewMode } = useApp();

  return (
    <>
      {viewMode === 'staff' ? <MainApp /> : <LandingPage />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
