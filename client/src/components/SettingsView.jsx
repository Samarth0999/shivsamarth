import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, Sliders, Shield, Award, DollarSign, 
  Receipt, Save, Plus, CheckCircle, AlertTriangle, Users, 
  ToggleLeft, ToggleRight, Edit, Trash2, X, Check, MapPin, Navigation, KeyRound
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export function SettingsView() {
  const { 
    currentUser, 
    isSuperAdmin,
    settings, 
    setSettings, 
    courseTypes, 
    paymentModes, 
    expenseCategories, 
    usersList, 
    branches,
    apiFetch, 
    showToast,
    loadInitialData 
  } = useApp();

  const [activeTab, setActiveTab] = useState('thresholds'); // 'thresholds' | 'courses' | 'categories' | 'rbac'
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  
  // Dynamic Settings form
  const [formSettings, setFormSettings] = useState({
    day_10_warning_threshold: settings.day_10_warning_threshold || '10',
    risk_low_remaining_days: settings.risk_low_remaining_days || '15',
    risk_high_remaining_days: settings.risk_high_remaining_days || '5',
    geofence_radius_meters: settings.geofence_radius_meters || '100',
    app_name: settings.app_name || 'Apex Pro Driving Academy',
    whatsapp_fee_reminder_template: settings.whatsapp_fee_reminder_template || ''
  });

  // Course Types form
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null); // when editing a course package
  const [newCourse, setNewCourse] = useState({
    name: '',
    duration_days: 26,
    base_fee: 8500,
    is_license_course: 1,
    description: ''
  });

  // Payment Modes state & inline editing
  const [newModeName, setNewModeName] = useState('');
  const [editingModeId, setEditingModeId] = useState(null);
  const [editingModeName, setEditingModeName] = useState('');

  // Expense Categories state & inline editing
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  // RBAC User Permissions Matrix editing
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [userDiscountLimit, setUserDiscountLimit] = useState(0);
  const [selectedUserDetails, setSelectedUserDetails] = useState({
    name: '',
    phone: '',
    role: '',
    branch_id: ''
  });

  // Staff registration state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'instructor',
    branch_id: '',
    password: 'password123',
    salary_type: 'monthly',
    base_salary: 18000,
    max_discount_limit: 0
  });

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.role) {
      showToast('Name, Email, and Role are required.', 'error');
      return;
    }
    try {
      await apiFetch('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          ...staffForm,
          name: staffForm.name.trim(),
          email: staffForm.email.trim().toLowerCase(),
          branch_id: staffForm.branch_id ? Number(staffForm.branch_id) : (branches[0]?.id || 1),
          base_salary: Number(staffForm.base_salary) || 0,
          max_discount_limit: Number(staffForm.max_discount_limit) || 0
        })
      });
      showToast(`Staff member "${staffForm.name}" registered successfully!`);
      setIsAddStaffOpen(false);
      setStaffForm({
        name: '',
        email: '',
        phone: '',
        role: 'instructor',
        branch_id: '',
        password: 'password123',
        salary_type: 'monthly',
        base_salary: 18000,
        max_discount_limit: 0
      });
      await loadInitialData(currentUser?.id || 1);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Branches state & management (Module 1)
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [newBranch, setNewBranch] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    latitude: '18.9904',
    longitude: '75.7607'
  });

  // Create Branch (Super Admin)
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranch.code.trim() || !newBranch.name.trim()) {
      showToast('Branch code and name are required', 'error');
      return;
    }
    try {
      await apiFetch('/api/branches', {
        method: 'POST',
        body: JSON.stringify({
          ...newBranch,
          code: newBranch.code.trim().toUpperCase(),
          latitude: parseFloat(newBranch.latitude) || 0,
          longitude: parseFloat(newBranch.longitude) || 0
        })
      });
      showToast(`Branch "${newBranch.name}" created successfully!`);
      setIsAddBranchOpen(false);
      setNewBranch({
        code: '',
        name: '',
        address: '',
        phone: '',
        latitude: '18.9904',
        longitude: '75.7607'
      });
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Update Branch (Super Admin)
  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    try {
      await apiFetch(`/api/branches/${editingBranch.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          code: editingBranch.code,
          name: editingBranch.name,
          address: editingBranch.address,
          phone: editingBranch.phone,
          latitude: parseFloat(editingBranch.latitude) || 0,
          longitude: parseFloat(editingBranch.longitude) || 0
        })
      });
      showToast(`Branch "${editingBranch.name}" updated successfully!`);
      setEditingBranch(null);
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Branch (Super Admin)
  const handleDeleteBranch = async (branch) => {
    if (!window.confirm(`Are you sure you want to delete branch "${branch.name}" (${branch.code})?`)) return;
    try {
      const res = await apiFetch(`/api/branches/${branch.id}`, { method: 'DELETE' });
      showToast(res.message || 'Branch deleted successfully');
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Detect GPS Location Helper
  const handleDetectGPS = (setter) => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setter(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        showToast('Current GPS coordinates detected!');
      },
      (err) => {
        showToast('Unable to fetch GPS: ' + err.message, 'error');
      }
    );
  };

  useEffect(() => {
    setFormSettings({
      day_10_warning_threshold: settings.day_10_warning_threshold || '10',
      risk_low_remaining_days: settings.risk_low_remaining_days || '15',
      risk_high_remaining_days: settings.risk_high_remaining_days || '5',
      geofence_radius_meters: settings.geofence_radius_meters || '100',
      app_name: settings.app_name || 'Apex Pro Driving Academy',
      whatsapp_fee_reminder_template: settings.whatsapp_fee_reminder_template || ''
    });
  }, [settings]);

  useEffect(() => {
    if (usersList.length > 0 && !selectedUser) {
      handleSelectUserForRBAC(usersList[0]);
    }
  }, [usersList]);

  const handleSelectUserForRBAC = (u) => {
    setSelectedUser(u);
    setUserPermissions(u.permissions || {});
    setUserDiscountLimit(u.max_discount_limit || 0);
    setSelectedUserDetails({
      name: u.name || '',
      phone: u.phone || '',
      role: u.role || 'instructor',
      branch_id: u.branch_id || ''
    });
  };

  // Save Dynamic System Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(formSettings)
      });
      setSettings(formSettings);
      showToast('Dynamic system parameters and thresholds updated!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // 1. COURSE PACKAGES ACTIONS (Add, Edit, Delete)
  // ==========================================

  // Add Course Type
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/settings/course-types', {
        method: 'POST',
        body: JSON.stringify(newCourse)
      });
      showToast(`Course type "${newCourse.name}" added!`);
      setIsAddCourseOpen(false);
      setNewCourse({
        name: '',
        duration_days: 26,
        base_fee: 8500,
        is_license_course: 1,
        description: ''
      });
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Update Existing Course Type
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await apiFetch(`/api/settings/course-types/${editingCourse.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingCourse)
      });
      showToast(`Course package "${editingCourse.name}" updated successfully!`);
      setEditingCourse(null);
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Course Type
  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete course package "${course.name}"?`)) return;
    try {
      const res = await apiFetch(`/api/settings/course-types/${course.id}`, {
        method: 'DELETE'
      });
      showToast(res.message, res.deactivated ? 'info' : 'success');
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // 2. PAYMENT MODES ACTIONS (Add, Edit, Delete)
  // ==========================================

  // Add Payment Mode
  const handleAddPaymentMode = async (e) => {
    e.preventDefault();
    if (!newModeName.trim()) return;
    try {
      await apiFetch('/api/settings/payment-modes', {
        method: 'POST',
        body: JSON.stringify({ name: newModeName.trim() })
      });
      showToast(`Payment mode "${newModeName}" added!`);
      setNewModeName('');
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Save Edited Payment Mode
  const handleSavePaymentModeEdit = async (id) => {
    if (!editingModeName.trim()) return;
    try {
      await apiFetch(`/api/settings/payment-modes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingModeName.trim() })
      });
      showToast('Payment mode updated successfully!');
      setEditingModeId(null);
      setEditingModeName('');
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Payment Mode
  const handleDeletePaymentMode = async (mode) => {
    if (!window.confirm(`Delete payment method "${mode.name}"?`)) return;
    try {
      const res = await apiFetch(`/api/settings/payment-modes/${mode.id}`, {
        method: 'DELETE'
      });
      showToast(res.message);
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // 3. EXPENSE CATEGORIES ACTIONS (Add, Edit, Delete)
  // ==========================================

  // Add Expense Category
  const handleAddExpenseCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await apiFetch('/api/settings/expense-categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim() })
      });
      showToast(`Expense category "${newCatName}" added!`);
      setNewCatName('');
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Save Edited Expense Category
  const handleSaveExpenseCatEdit = async (id) => {
    if (!editingCatName.trim()) return;
    try {
      await apiFetch(`/api/settings/expense-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingCatName.trim() })
      });
      showToast('Expense category updated successfully!');
      setEditingCatId(null);
      setEditingCatName('');
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Expense Category
  const handleDeleteExpenseCategory = async (cat) => {
    if (!window.confirm(`Delete operational expense tag "${cat.name}"?`)) return;
    try {
      const res = await apiFetch(`/api/settings/expense-categories/${cat.id}`, {
        method: 'DELETE'
      });
      showToast(res.message);
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Save RBAC Matrix & Profile updates for selected user
  const handleSaveRBAC = async () => {
    if (!selectedUser) return;
    try {
      await apiFetch(`/api/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: selectedUserDetails.name,
          phone: selectedUserDetails.phone,
          role: selectedUserDetails.role,
          branch_id: selectedUserDetails.branch_id ? Number(selectedUserDetails.branch_id) : null,
          permissions: userPermissions,
          max_discount_limit: Number(userDiscountLimit)
        })
      });
      showToast(`Privileges and account details updated for ${selectedUserDetails.name || selectedUser.name}!`);
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Staff User (Super Admin Master Delete)
  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      showToast('You cannot delete your own logged-in account.', 'error');
      return;
    }
    if (!window.confirm(`[MASTER DELETE: Super Admin]\n\nAre you sure you want to permanently delete staff user "${user.name}" (${user.role})?\n\nTheir permissions and instructor/lead assignments will be safely unlinked.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/auth/users/${user.id}`, { method: 'DELETE' });
      showToast(res.message || 'Staff user deleted permanently');
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
      loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const togglePermission = (key) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const rbacFunctionCategories = [
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

  const handleGrantAll = () => {
    const all = {};
    rbacFunctionCategories.forEach(cat => {
      cat.switches.forEach(sw => {
        all[sw.key] = true;
      });
    });
    setUserPermissions(all);
  };

  const handleRevokeAll = () => {
    const none = {};
    rbacFunctionCategories.forEach(cat => {
      cat.switches.forEach(sw => {
        none[sw.key] = false;
      });
    });
    setUserPermissions(none);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dynamic Admin Settings Hub & RBAC Matrix</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              Super Admin Controls
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Module 2 & 3: Configure business packages, payment methods, expense categories, risk trigger thresholds, and individual staff permission toggles.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'branches' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'}`}
          >
            📍 Branches & Geofence
          </button>
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'thresholds' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            ⚙️ Thresholds & Triggers
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'courses' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            🚗 Course Packages
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            🏷️ Categories & Modes
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'rbac' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            🛡️ RBAC Privilege Matrix
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 0. BRANCHES & MULTI-BRANCH ARCHITECTURE (Module 1) */}
      {/* ============================================================== */}
      {activeTab === 'branches' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>Multi-Branch Architecture & Location Hub</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {branches.length} Active Branches
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage branch nodes, unique sequence codes (e.g. BEED, PUNE, JALNA), and GPS coordinates for mobile attendance geofencing.
              </p>
            </div>
            <button
              onClick={() => setIsAddBranchOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Branch</span>
            </button>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(b => (
              <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                      CODE: {b.code}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Node
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-2.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{b.name}</span>
                  </h4>

                  {b.address && (
                    <p className="text-xs text-slate-600 mt-1 pl-5 line-clamp-2">
                      {b.address}
                    </p>
                  )}

                  {b.phone && (
                    <p className="text-xs text-slate-500 mt-1 pl-5">
                      Phone: <span className="font-semibold text-slate-700">{b.phone}</span>
                    </p>
                  )}

                  <div className="mt-3 pl-2 p-2 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                    <span>GPS Geofence:</span>
                    <span className="font-bold text-slate-700">
                      {Number(b.latitude)?.toFixed(4)}, {Number(b.longitude)?.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    ID #{b.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBranch(b)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit Branch Coordinates & Info"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(b)}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. THRESHOLDS & TRIGGER ADJUSTERS (Module 2) */}
      {/* ============================================================== */}
      {activeTab === 'thresholds' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">System Risk Thresholds & Geofence Adjusters</h3>
              <p className="text-xs text-slate-500 mt-0.5">Adjust business parameters dynamically without writing code</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            
            {/* Day 10 Soft Warning Threshold */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">Day 10 Soft Warning Threshold (Training Days)</label>
              <p className="text-[11px] text-slate-500 mb-2">Number of completed training days to flag students with unpaid balance.</p>
              <input
                type="number"
                min="1"
                max="25"
                value={formSettings.day_10_warning_threshold}
                onChange={e => setFormSettings({ ...formSettings, day_10_warning_threshold: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm"
              />
            </div>

            {/* Geofence Check-in Radius */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">Geofence Check-In Radius (Meters)</label>
              <p className="text-[11px] text-slate-500 mb-2">Perimeter boundary around branch coordinates for staff attendance validation.</p>
              <input
                type="number"
                min="10"
                max="5000"
                value={formSettings.geofence_radius_meters}
                onChange={e => setFormSettings({ ...formSettings, geofence_radius_meters: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm"
              />
            </div>

            {/* Low Risk Remaining Days Boundary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">Low Risk Threshold (Remaining Days ≥)</label>
              <p className="text-[11px] text-slate-500 mb-2">Students with remaining training days above this are marked Low Risk.</p>
              <input
                type="number"
                min="5"
                max="30"
                value={formSettings.risk_low_remaining_days}
                onChange={e => setFormSettings({ ...formSettings, risk_low_remaining_days: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm"
              />
            </div>

            {/* High Risk Remaining Days Boundary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">High Risk Threshold (Remaining Days ≤)</label>
              <p className="text-[11px] text-slate-500 mb-2">Students nearing completion with unpaid dues are marked High Risk.</p>
              <input
                type="number"
                min="1"
                max="10"
                value={formSettings.risk_high_remaining_days}
                onChange={e => setFormSettings({ ...formSettings, risk_high_remaining_days: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm"
              />
            </div>

            {/* Application Branding Name */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">Application Brand Name</label>
              <input
                type="text"
                value={formSettings.app_name}
                onChange={e => setFormSettings({ ...formSettings, app_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm"
              />
            </div>

            {/* WhatsApp Fee Reminder Template */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">WhatsApp Fee Reminder Message Template</label>
              <p className="text-[11px] text-slate-500 mb-2">
                Available tags: <code className="bg-slate-200 px-1 py-0.5 rounded">{`{student_name}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{school_name}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{branch_name}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{days_completed}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{pending_balance}`}</code>
              </p>
              <textarea
                rows={3}
                value={formSettings.whatsapp_fee_reminder_template}
                onChange={e => setFormSettings({ ...formSettings, whatsapp_fee_reminder_template: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 2. COURSE TYPES MANAGEMENT (Editable & Deletable) */}
      {/* ============================================================== */}
      {activeTab === 'courses' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Training Course Packages & Pricing Hub</h3>
              <p className="text-xs text-slate-500 mt-0.5">Edit package parameters, change durations or base fees, toggle RTO license status, or delete packages.</p>
            </div>
            <button
              onClick={() => setIsAddCourseOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course Package</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Package Name</th>
                  <th className="py-2.5 px-3">Training Duration</th>
                  <th className="py-2.5 px-3">Base Fee (Locked)</th>
                  <th className="py-2.5 px-3">RTO License Section</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courseTypes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.description || 'No description added'}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{c.duration_days} Days</td>
                    <td className="py-3 px-3 font-mono font-black text-blue-700 text-sm">₹{c.base_fee}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.is_license_course ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.is_license_course ? 'License Included' : 'Practice Only'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingCourse({ ...c })}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                          title="Edit Course Package"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                          title="Delete Course Package"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Course Modal */}
          {isAddCourseOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Add Course Package</h3>
                  <button onClick={() => setIsAddCourseOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Course Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Heavy Vehicle Training"
                      value={newCourse.name}
                      onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Duration (Days) *</label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={newCourse.duration_days}
                        onChange={e => setNewCourse({ ...newCourse, duration_days: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Base Fee (₹) *</label>
                      <input
                        type="number"
                        min="1000"
                        value={newCourse.base_fee}
                        onChange={e => setNewCourse({ ...newCourse, base_fee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold font-mono"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Includes RTO License Processing?</label>
                    <select
                      value={newCourse.is_license_course}
                      onChange={e => setNewCourse({ ...newCourse, is_license_course: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    >
                      <option value={1}>Yes - Expands LL & DL Fields (is_license_course = true)</option>
                      <option value={0}>No - Practical Driving Only (is_license_course = false)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Course Description</label>
                    <input
                      type="text"
                      placeholder="Optional details"
                      value={newCourse.description}
                      onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div className="pt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddCourseOpen(false)} className="px-3 py-2 rounded-xl text-slate-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl">Save Package</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Course Modal */}
          {editingCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Edit Course Package</h3>
                  <button onClick={() => setEditingCourse(null)}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <form onSubmit={handleUpdateCourse} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Course Name *</label>
                    <input
                      type="text"
                      value={editingCourse.name}
                      onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Duration (Days) *</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={editingCourse.duration_days}
                        onChange={e => setEditingCourse({ ...editingCourse, duration_days: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Base Fee (₹) *</label>
                      <input
                        type="number"
                        min="100"
                        value={editingCourse.base_fee}
                        onChange={e => setEditingCourse({ ...editingCourse, base_fee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold font-mono text-sm text-blue-700"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">License Course Flag</label>
                      <select
                        value={editingCourse.is_license_course ? 1 : 0}
                        onChange={e => setEditingCourse({ ...editingCourse, is_license_course: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                      >
                        <option value={1}>License Included</option>
                        <option value={0}>Practice Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Package Status</label>
                      <select
                        value={editingCourse.is_active ? 1 : 0}
                        onChange={e => setEditingCourse({ ...editingCourse, is_active: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingCourse.description || ''}
                      onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                    />
                  </div>
                  <div className="pt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingCourse(null)} className="px-3 py-2 rounded-xl text-slate-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-xs">Update Package</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CATEGORIES & PAYMENT MODES (Editable & Deletable) */}
      {/* ============================================================== */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Payment Modes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Accepted Payment Modes</h3>
                <p className="text-[11px] text-slate-500">Edit names or delete accepted methods.</p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {paymentModes.length} Modes
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {paymentModes.map(m => (
                <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  {editingModeId === m.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingModeName}
                        onChange={e => setEditingModeName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-blue-400 rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePaymentModeEdit(m.id)}
                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingModeId(null); setEditingModeName(''); }}
                        className="p-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{m.name}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingModeId(m.id); setEditingModeName(m.name); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Payment Mode"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePaymentMode(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Payment Mode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddPaymentMode} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="New payment mode name..."
                value={newModeName}
                onChange={e => setNewModeName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs">
                Add Mode
              </button>
            </form>
          </div>

          {/* Expense Categories */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Operational Expense Tags</h3>
                <p className="text-[11px] text-slate-500">Edit tag names or delete operational cost categories.</p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {expenseCategories.length} Tags
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {expenseCategories.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  {editingCatId === c.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-blue-400 rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveExpenseCatEdit(c.id)}
                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingCatId(null); setEditingCatName(''); }}
                        className="p-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Category Tag"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpenseCategory(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Category Tag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddExpenseCategory} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="New operational tag name..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs">
                Add Tag
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. RBAC PRIVILEGE MATRIX (Module 3) */}
      {/* ============================================================== */}
      {activeTab === 'rbac' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Granular Role-Based Access Control (RBAC) Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Toggle CRUD rights, financial privileges (max discount limit ₹, refunds), and WhatsApp switches per user</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Staff</span>
              </button>
              <button
                onClick={handleSaveRBAC}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Privileges</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            
            {/* User Selector List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Roster</span>
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(true)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Staff</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Register New Staff Member</span>
              </button>
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {usersList.map(u => (
                  <div
                    key={u.id}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      selectedUser?.id === u.id ? 'bg-blue-50 border-blue-500 font-bold' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectUserForRBAC(u)}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="text-slate-800 truncate">{u.name}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{u.role.replace('_', ' ')} • {u.branch_name || 'All'}</div>
                    </button>
                    <div className="flex items-center gap-1 ml-1 shrink-0">
                      {(isSuperAdmin || u.id === currentUser?.id) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPasswordTargetUser(u);
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                          title={isSuperAdmin && u.id !== currentUser?.id ? `Master Reset Password for ${u.name}` : 'Change Password'}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isSuperAdmin && u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Master Delete Staff User (Super Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privilege Toggles for Selected User */}
            {selectedUser && (
              <div className="md:col-span-2 space-y-5">
                
                {/* Account Details & Branch Assignment */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Staff Account & Branch Assignment</h4>
                    {isSuperAdmin && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Super Admin Master Edit
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={selectedUserDetails.name}
                        onChange={e => setSelectedUserDetails({ ...selectedUserDetails, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Mobile Phone</label>
                      <input
                        type="tel"
                        value={selectedUserDetails.phone}
                        onChange={e => setSelectedUserDetails({ ...selectedUserDetails, phone: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Role Designation</label>
                      <select
                        value={selectedUserDetails.role}
                        onChange={e => setSelectedUserDetails({ ...selectedUserDetails, role: e.target.value })}
                        disabled={!isSuperAdmin || selectedUser.id === currentUser?.id}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="super_admin">Super Admin (Master)</option>
                        <option value="branch_manager">Branch Manager</option>
                        <option value="instructor">Driving Instructor</option>
                        <option value="office_staff">Office Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Assigned Branch</label>
                      <select
                        value={selectedUserDetails.branch_id || ''}
                        onChange={e => setSelectedUserDetails({ ...selectedUserDetails, branch_id: e.target.value ? Number(e.target.value) : '' })}
                        disabled={!isSuperAdmin}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">All Branches (HQ)</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Staff Security & Password Control */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Staff Security & Password Control</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isSuperAdmin
                          ? (selectedUser.id === currentUser?.id
                              ? 'Change your master login password.'
                              : `Super Admin Master Privilege: Set or reset password for ${selectedUser.name}.`)
                          : 'Change your personal login password.'}
                      </p>
                    </div>
                    {(isSuperAdmin || selectedUser.id === currentUser?.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordTargetUser(selectedUser);
                          setIsPasswordModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {isSuperAdmin && selectedUser.id !== currentUser?.id
                            ? `Reset Password for ${selectedUser.name.split(' ')[0]}`
                            : 'Change My Password'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Financial Controls */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2">Financial Privileges & Discount Limit</h4>
                  <div>
                    <label className="block text-slate-600 mb-1">Max Authorized Discount Limit (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={userDiscountLimit}
                      onChange={e => setUserDiscountLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Staff cannot apply discounts higher than this amount during student registration.</p>
                  </div>
                </div>

                {/* Granular Privilege Toggles - Every Function in the System */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Core CRUD & Operational Switches</h4>
                      <p className="text-[10px] text-slate-500">Fine-grained access control toggles for every operational capability</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGrantAll}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Grant All
                      </button>
                      <button
                        type="button"
                        onClick={handleRevokeAll}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Revoke All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {rbacFunctionCategories.map((group) => (
                      <div key={group.category} className="space-y-1.5">
                        <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50/70 px-2.5 py-1 rounded-md border border-blue-100">
                          {group.category}
                        </div>
                        <div className="space-y-1 pl-1">
                          {group.switches.map((item) => {
                            const isGranted = Boolean(userPermissions[item.key]);
                            return (
                              <div 
                                key={item.key} 
                                className="flex justify-between items-center py-2 px-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
                              >
                                <div className="pr-3">
                                  <div className="font-semibold text-slate-800 text-xs">{item.label}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => togglePermission(item.key)}
                                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all shrink-0 ${
                                    isGranted 
                                      ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700' 
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                >
                                  {isGranted ? 'Enabled' : 'Disabled'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ADD BRANCH MODAL */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Add New Driving School Branch</span>
              </h3>
              <button onClick={() => setIsAddBranchOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JALNA, PUNE"
                    value={newBranch.code}
                    onChange={e => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Used in auto student Enroll IDs (e.g. JALNA-2026-001)</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jalna Bypass Branch"
                    value={newBranch.name}
                    onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address & Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Bus Stand, Jalna Road, Maharashtra"
                  value={newBranch.address}
                  onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone / Mobile</label>
                <input
                  type="text"
                  placeholder="e.g. 9822100002"
                  value={newBranch.phone}
                  onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Geofence GPS Coordinates */}
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Geofence GPS Coordinates</span>
                  <button
                    type="button"
                    onClick={() => handleDetectGPS(setNewBranch)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Detect My Current GPS</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newBranch.latitude}
                      onChange={e => setNewBranch({ ...newBranch, latitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newBranch.longitude}
                      onChange={e => setNewBranch({ ...newBranch, longitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Staff mobile attendance is validated against this GPS point within the {settings.geofence_radius_meters || 100}m radius.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Create Branch Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRANCH MODAL */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>Edit Branch: {editingBranch.name}</span>
              </h3>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.name}
                    onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSMB"
                    value={editingBranch.code || ''}
                    onChange={e => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={editingBranch.address || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingBranch.phone || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Geofence GPS Coordinates */}
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Geofence GPS Coordinates</span>
                  <button
                    type="button"
                    onClick={() => handleDetectGPS(setEditingBranch)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Detect My Current GPS</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingBranch.latitude}
                      onChange={e => setEditingBranch({ ...editingBranch, latitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingBranch.longitude}
                      onChange={e => setEditingBranch({ ...editingBranch, longitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Staff Member */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add New Staff Member</h3>
                  <p className="text-xs text-slate-500">Register instructor, manager, or office counselor</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Santosh Kadam"
                    required
                    value={staffForm.name}
                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9822112233"
                    value={staffForm.phone}
                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    placeholder="rahul@shivsamarth.com"
                    required
                    value={staffForm.email}
                    onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Login Password</label>
                  <input
                    type="text"
                    value={staffForm.password}
                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    placeholder="password123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designated Role *</label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="instructor">Driving Instructor</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="office_staff">Counselor / Office Desk</option>
                    <option value="super_admin">Super Admin (Executive Owner)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Branch</label>
                  <select
                    value={staffForm.branch_id}
                    onChange={e => setStaffForm({ ...staffForm, branch_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>📍 {b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Salary & Financial Privileges</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Salary Type</label>
                    <select
                      value={staffForm.salary_type}
                      onChange={e => setStaffForm({ ...staffForm, salary_type: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="monthly">Monthly Fixed</option>
                      <option value="daily">Per Day Wage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Base Salary (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={staffForm.base_salary}
                      onChange={e => setStaffForm({ ...staffForm, base_salary: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={staffForm.max_discount_limit}
                      onChange={e => setStaffForm({ ...staffForm, max_discount_limit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Staff Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordTargetUser(null);
        }}
        targetUser={passwordTargetUser}
        onSuccess={() => loadInitialData(currentUser?.id)}
      />

    </div>
  );
}
