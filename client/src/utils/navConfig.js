import { 
  LayoutDashboard, Users, CheckSquare, AlertTriangle, 
  Receipt, Wallet, FileText, Settings, MapPin, MessageSquare, Car 
} from 'lucide-react';

export function getNavItems({ currentUser, hasPermission }) {
  const isInstructor = currentUser?.role === 'instructor';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canAccessExpenses = isSuperAdmin || (Boolean(hasPermission) && (hasPermission('view_expenses') || hasPermission('edit_expenses')));

  if (isInstructor) {
    return [
      { id: 'instructor', label: 'Batch Attendance', shortLabel: 'Attendance', icon: CheckSquare },
      { id: 'instructor-checkin', label: 'GPS Geofenced Check-In', shortLabel: 'GPS Check-In', icon: MapPin },
      { id: 'instructor-wages', label: 'My Wages & History', shortLabel: 'My Wages', icon: Wallet },
      { id: 'instructor-reminders', label: 'Day 10 Soft Warnings', shortLabel: 'Warnings', icon: AlertTriangle, badge: 'WhatsApp' }
    ];
  }

  return [
    { id: 'dashboard', label: 'Master Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Website Inquiries', shortLabel: 'Inquiries', icon: MessageSquare, badge: 'Leads' },
    { id: 'students', label: 'Students & Admissions', shortLabel: 'Students', icon: Users },
    { id: 'batches', label: 'Batches & Vehicle Fleet', shortLabel: 'Batches & Fleet', icon: Car },
    { id: 'attendance', label: 'Attendance & Lessons', shortLabel: 'Attendance', icon: CheckSquare },
    { id: 'risk', label: 'Risk Matrix & Day 10', shortLabel: 'Risk Alerts', icon: AlertTriangle, badge: 'Alerts' },
    ...(canAccessExpenses ? [{ id: 'expenses', label: 'Daily Expense Tracker', shortLabel: 'Expenses', icon: Receipt }] : []),
    { id: 'payroll', label: 'Staff & Payroll Engine', shortLabel: 'Payroll', icon: Wallet },
    { id: 'reports', label: 'Reports & PDF Export', shortLabel: 'Reports', icon: FileText },
    ...(isSuperAdmin ? [{ id: 'settings', label: 'Admin Settings Hub', shortLabel: 'Settings', icon: Settings }] : [])
  ];
}
