import {
  LayoutGrid, Users, UserPlus, ClipboardList, Receipt, DollarSign,
  AlertTriangle, BookOpen, CheckSquare, Car, UserCog, Wallet,
  BarChart3, Settings, MapPin
} from 'lucide-react';

/**
 * Returns categorized navigation sections matching the Shivsamarth Management System sidebar.
 */
export function getNavSections({ currentUser, hasPermission }) {
  const isInstructor = currentUser?.role === 'instructor';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canAccessExpenses = isSuperAdmin || (Boolean(hasPermission) && (hasPermission('view_expenses') || hasPermission('edit_expenses')));

  if (isInstructor) {
    return [
      {
        id: 'main',
        title: 'MAIN',
        icon: CheckSquare,
        items: [
          {
            id: 'instructor',
            label: 'Daily Register',
            shortLabel: 'Daily Register',
            description: 'Mark daily batch attendance',
            icon: CheckSquare
          },
          {
            id: 'instructor-checkin',
            label: 'GPS Check-In',
            shortLabel: 'GPS Check-In',
            description: 'Verify branch GPS check-in',
            icon: MapPin
          }
        ]
      },
      {
        id: 'finance',
        title: 'FINANCE & ALERTS',
        icon: Wallet,
        items: [
          {
            id: 'instructor-wages',
            label: 'My Wages',
            shortLabel: 'My Wages',
            description: 'Attendance logs & pay summary',
            icon: Wallet
          },
          {
            id: 'instructor-reminders',
            label: 'Day 10 Warnings',
            shortLabel: 'Warnings',
            description: 'Send Day 10 WhatsApp reminders',
            icon: AlertTriangle
          }
        ]
      }
    ];
  }

  return [
    {
      id: 'main',
      title: 'MAIN',
      icon: LayoutGrid,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          shortLabel: 'Dashboard',
          description: 'Executive overview & KPIs',
          icon: LayoutGrid
        }
      ]
    },
    {
      id: 'enrollments',
      title: 'ENROLLMENTS',
      icon: Users,
      items: [
        {
          id: 'leads',
          label: 'Leads Pipeline',
          shortLabel: 'Leads Pipeline',
          description: 'Track inquiries & follow-ups',
          icon: UserPlus
        },
        {
          id: 'students',
          label: 'Students',
          shortLabel: 'Students',
          description: 'Registered students directory',
          icon: Users
        },
        {
          id: 'admissions',
          label: 'Admissions',
          shortLabel: 'Admissions',
          description: 'Course enrollments & RTO progress',
          icon: ClipboardList
        }
      ]
    },
    {
      id: 'finance',
      title: 'FINANCE',
      icon: DollarSign,
      items: [
        {
          id: 'payments',
          label: 'Fee Payments & Receipts',
          shortLabel: 'Fee Payments',
          description: 'Immutable ledger & official receipts',
          icon: Receipt
        },
        ...(canAccessExpenses ? [{
          id: 'expenses',
          label: 'Expenses',
          shortLabel: 'Expenses',
          description: 'Fuel, maintenance & daily costs',
          icon: DollarSign
        }] : []),
        {
          id: 'risk',
          label: 'Risk & Alerts',
          shortLabel: 'Risk & Alerts',
          description: 'Day 10 warnings & fee receivables',
          icon: AlertTriangle
        }
      ]
    },
    {
      id: 'operations',
      title: 'OPERATIONS',
      icon: BookOpen,
      items: [
        {
          id: 'courses',
          label: 'Courses',
          shortLabel: 'Courses',
          description: 'Dynamic course catalog & fees',
          icon: BookOpen
        },
        {
          id: 'attendance',
          label: 'Daily Register',
          shortLabel: 'Daily Register',
          description: 'Lesson progress & attendance',
          icon: CheckSquare
        },
        {
          id: 'batches',
          label: 'Fleet & Batches',
          shortLabel: 'Fleet & Batches',
          description: 'Training vehicles & time slots',
          icon: Car
        },
        {
          id: 'staff',
          label: 'Staff',
          shortLabel: 'Staff',
          description: 'Staff accounts, roles & permissions',
          icon: UserCog
        },
        {
          id: 'payroll',
          label: 'Payroll',
          shortLabel: 'Payroll',
          description: 'Monthly salaries & wage ledger',
          icon: Wallet
        }
      ]
    },
    {
      id: 'analytics',
      title: 'ANALYTICS',
      icon: BarChart3,
      items: [
        {
          id: 'reports',
          label: 'MIS Reports',
          shortLabel: 'MIS Reports',
          description: 'Executive analytics & PDF export',
          icon: BarChart3
        }
      ]
    },
    ...(isSuperAdmin ? [{
      id: 'system',
      title: 'SYSTEM',
      icon: Settings,
      items: [
        {
          id: 'settings',
          label: 'Settings',
          shortLabel: 'Settings',
          description: 'Branches, RBAC & configuration',
          icon: Settings
        }
      ]
    }] : [])
  ].filter(section => section.items.length > 0);
}

/**
 * Returns a flat list of navigation items derived from the categorized sections.
 */
export function getNavItems({ currentUser, hasPermission }) {
  return getNavSections({ currentUser, hasPermission }).flatMap(section => section.items);
}
