import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { CategoryNavBar } from './components/CategoryNavBar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Dashboard } from './components/Dashboard';
import { LeadsView } from './components/LeadsView';
import { StudentsView } from './components/StudentsView';
import { AdmissionsView } from './components/AdmissionsView';
import { FeePaymentsView } from './components/FeePaymentsView';
import { CoursesView } from './components/CoursesView';
import { StaffView } from './components/StaffView';
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

function MainApp() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    toast,
    setViewMode,
    isNavOpen
  } = useApp();
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);

  const isInstructor = currentUser?.role === 'instructor';

  const handleOpenAdmission = () => {
    setActiveTab('students');
    setIsAdmissionModalOpen(true);
  };

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
    <div className="h-dvh flex overflow-hidden bg-[#f8f9fc] text-slate-800">

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border border-slate-800 bg-slate-900 text-white text-xs font-semibold animate-slide-up">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Full-Height Left Sidebar */}
      <Sidebar />

      {/* Right Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header Bar */}
        <Header />

        {/* Categorized Horizontal Navigation Bar when Sidebar is Collapsed */}
        {!isNavOpen && <CategoryNavBar />}

        {/* Main Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {isInstructor ? (
              <InstructorView />
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard onOpenAdmission={handleOpenAdmission} />}
                {activeTab === 'leads' && (
                  <LeadsView onConvertSuccess={() => setActiveTab('students')} />
                )}
                {activeTab === 'students' && (
                  <StudentsView
                    isAdmissionModalOpen={isAdmissionModalOpen}
                    setIsAdmissionModalOpen={setIsAdmissionModalOpen}
                  />
                )}
                {activeTab === 'admissions' && (
                  <AdmissionsView
                    onOpenAdmission={handleOpenAdmission}
                    onOpenStudent={() => setActiveTab('students')}
                  />
                )}
                {activeTab === 'payments' && <FeePaymentsView />}
                {activeTab === 'courses' && <CoursesView />}
                {activeTab === 'staff' && <StaffView />}
                {activeTab === 'batches' && <BatchesView />}
                {activeTab === 'attendance' && <AttendanceView />}
                {activeTab === 'risk' && <RiskMatrixView />}
                {activeTab === 'expenses' && <ExpensesView />}
                {activeTab === 'payroll' && <PayrollView />}
                {activeTab === 'reports' && <ReportsView />}
                {activeTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <MobileBottomNav />

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
      <Analytics />
    </AppProvider>
  );
}
