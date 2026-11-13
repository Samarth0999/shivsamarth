export const RBAC_CATEGORIES = [
  {
    category: '1. Students, Admissions & Lessons',
    switches: [
      { key: 'manage_students', label: 'Create & Edit Student Admissions', desc: 'Register new students, issue Enroll IDs, and edit student profiles' },
      { key: 'delete_students', label: 'Delete Student Records', desc: 'Permanently remove student profiles, attendance, and logs' },
      { key: 'manage_attendance', label: 'Record Attendance & Lesson Hours', desc: 'Mark daily driving lessons, absent penalties, and instructor logs' },
      { key: 'schedule_rto', label: 'Schedule RTO Driving License Tests', desc: 'Book RTO driving test dates subject to hard gate checks' }
    ]
  },
  {
    category: '2. Fee Collections & Payment Ledger',
    switches: [
      { key: 'collect_payments', label: 'Collect Course Fee Payments', desc: 'Accept cash/UPI fee payments and generate official PDF receipts' },
      { key: 'edit_payments', label: 'Edit Existing Payment Receipts', desc: 'Correct payment amounts, dates, modes, and receipt references' },
      { key: 'delete_payments', label: 'Delete / Void Fee Payments', desc: 'Void payment receipts and automatically adjust pending balances' },
      { key: 'process_refunds', label: 'Process Student Fee Refunds', desc: 'Issue credit balances or fee refunds for discontinued courses' }
    ]
  },
  {
    category: '3. Daily Operational Expenses & Accounting',
    switches: [
      { key: 'view_expenses', label: 'View Operational Expenses & Costs', desc: 'Access expense tracker, fuel logs, and vehicle maintenance costs' },
      { key: 'edit_expenses', label: 'Add & Edit Operational Expenses', desc: 'Record daily branch fuel, repairs, tea, and RTO office challans' },
      { key: 'delete_expenses', label: 'Delete Operational Expense Records', desc: 'Remove recorded expense entries from ledger' }
    ]
  },
  {
    category: '4. Fleet Vehicles & Maintenance',
    switches: [
      { key: 'manage_vehicles', label: 'Register & Edit Fleet Vehicles', desc: 'Add new cars, dual-control specs, and update insurance/PUC/fitness' },
      { key: 'delete_vehicles', label: 'Delete Vehicles from Fleet', desc: 'Retire or delete vehicle records and decouple from rotations' }
    ]
  },
  {
    category: '5. Batch Time Slots & Rotations',
    switches: [
      { key: 'manage_batches', label: 'Create & Edit Batch Time Slots', desc: 'Manage 1-hour time slots, capacity limits, and batch names' },
      { key: 'delete_batches', label: 'Delete Batch Slots', desc: 'Remove time slots and safely unassign enrolled trainees' },
      { key: 'manage_rotations', label: 'Schedule Fleet Rotations', desc: 'Schedule weekly vehicle wear-balancing swaps across slots' },
      { key: 'delete_rotations', label: 'Delete Rotation Schedules', desc: 'Remove vehicle rotation assignments' }
    ]
  },
  {
    category: '6. Website Inquiries & Leads Pipeline',
    switches: [
      { key: 'manage_leads', label: 'View & Edit Website Inquiries', desc: 'Review leads from public website, phone calls, and notes' },
      { key: 'delete_leads', label: 'Delete Leads & Inquiries', desc: 'Remove cold or spam inquiries from pipeline' },
      { key: 'convert_leads', label: 'Convert Inquiries to Enrolled Students', desc: 'Convert prospect directly into student with advance receipt' }
    ]
  },
  {
    category: '7. Customer Engagement & Administration',
    switches: [
      { key: 'send_whatsapp_alerts', label: 'Send WhatsApp Fee & Lesson Alerts', desc: 'Trigger pre-filled WhatsApp reminders to students and parents' },
      { key: 'export_reports', label: 'Export PDF Financial Reports', desc: 'Download official collection and defaulter summary PDF audits' },
      { key: 'view_payroll', label: 'View Staff Wages & Payroll Engine', desc: 'Inspect monthly instructor wages and salary calculations' },
      { key: 'manage_settings', label: 'Manage Academy Settings & Courses', desc: 'Access course packages, payment modes, and thresholds' }
    ]
  }
];

export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: {
    manage_students: true, delete_students: true, manage_attendance: true, schedule_rto: true,
    collect_payments: true, edit_payments: true, delete_payments: true, process_refunds: true,
    view_expenses: true, edit_expenses: true, delete_expenses: true,
    manage_vehicles: true, delete_vehicles: true,
    manage_batches: true, delete_batches: true, manage_rotations: true, delete_rotations: true,
    manage_leads: true, delete_leads: true, convert_leads: true,
    send_whatsapp_alerts: true, export_reports: true, view_payroll: true, manage_settings: true
  },
  branch_manager: {
    manage_students: true, manage_attendance: true, schedule_rto: true,
    collect_payments: true, edit_payments: true,
    view_expenses: true, edit_expenses: true,
    manage_vehicles: true, manage_batches: true, manage_rotations: true,
    manage_leads: true, convert_leads: true,
    send_whatsapp_alerts: true, export_reports: true, view_payroll: true
  },
  instructor: {
    manage_attendance: true,
    send_whatsapp_alerts: true
  },
  office_staff: {
    manage_students: true,
    collect_payments: true,
    manage_leads: true,
    convert_leads: true,
    send_whatsapp_alerts: true
  }
};

