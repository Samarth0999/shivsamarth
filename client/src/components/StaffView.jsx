import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCog, Plus, Search, Shield, Edit, Trash2,
  KeyRound, X, Building2, Phone, Mail
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

const PERMISSION_KEYS = [
  { key: 'view_leads', label: 'View Leads' },
  { key: 'manage_leads', label: 'Manage Leads' },
  { key: 'manage_students', label: 'Manage Students' },
  { key: 'manage_vehicles', label: 'Manage Vehicles' },
  { key: 'manage_batches', label: 'Manage Batches' },
  { key: 'view_expenses', label: 'View Expenses' },
  { key: 'edit_expenses', label: 'Edit Expenses' },
  { key: 'process_refunds', label: 'Process Refunds' },
  { key: 'delete_payments', label: 'Delete Payments' },
  { key: 'send_whatsapp_alerts', label: 'Send WhatsApp Alerts' }
];

export function StaffView() {
  const { currentUser, isSuperAdmin, branches, selectedBranchId, apiFetch, showToast } = useApp();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Create / Edit Staff Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'instructor',
    branch_id: '',
    password: 'password123',
    salary_type: 'monthly',
    base_salary: 18000,
    max_discount_limit: 0,
    is_active: 1,
    permissions: {}
  });
  const [submitting, setSubmitting] = useState(false);

  // Password Reset Modal
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/users');
      setStaff(res.users || []);
    } catch (err) {
      showToast(err.message || 'Failed to load staff directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const openCreateModal = () => {
    setEditingStaff(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'instructor',
      branch_id: selectedBranchId || branches[0]?.id || '',
      password: 'password123',
      salary_type: 'monthly',
      base_salary: 18000,
      max_discount_limit: 0,
      is_active: 1,
      permissions: {}
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingStaff(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'instructor',
      branch_id: user.branch_id || '',
      password: '',
      salary_type: user.salary_type || 'monthly',
      base_salary: user.base_salary || 0,
      max_discount_limit: user.max_discount_limit || 0,
      is_active: user.is_active ? 1 : 0,
      permissions: user.parsedPermissions || {}
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || (!editingStaff && !form.email.trim())) {
      showToast('Name and Email are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        base_salary: Number(form.base_salary || 0),
        max_discount_limit: Number(form.max_discount_limit || 0)
      };

      if (editingStaff) {
        if (!payload.password) delete payload.password;
        await apiFetch(`/api/auth/users/${editingStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Staff account & permissions updated!');
      } else {
        await apiFetch('/api/auth/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Staff account created successfully!');
      }
      setIsModalOpen(false);
      loadStaff();
    } catch (err) {
      showToast(err.message || 'Failed to save staff account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (user) => {
    try {
      await apiFetch(`/api/auth/users/${user.id}`, { method: 'DELETE' });
      showToast(`Removed staff account: ${user.name}`);
      loadStaff();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const filtered = staff.filter(u => {
    if (selectedBranchId && u.branch_id && Number(u.branch_id) !== Number(selectedBranchId)) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roleBadgeClass = (role) => {
    if (role === 'super_admin') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (role === 'branch_manager') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (role === 'instructor') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCog className="w-6 h-6 text-purple-600" />
            <span>Staff Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user accounts, roles, branch assignments, and individual access permissions.
          </p>
        </div>

        {(isSuperAdmin || currentUser?.role === 'branch_manager') && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/20 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

      {/* Role Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Team</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{staff.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active staff accounts</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admins & Managers</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">
            {staff.filter(u => u.role === 'super_admin' || u.role === 'branch_manager').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Leadership & oversight</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Instructors</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
            {staff.filter(u => u.role === 'instructor').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Field driving trainers</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Front Office</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
            {staff.filter(u => u.role === 'office_staff').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Counselors & cashiers</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff name, email, or phone..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'super_admin', label: 'Super Admin' },
            { id: 'branch_manager', label: 'Managers' },
            { id: 'instructor', label: 'Instructors' },
            { id: 'office_staff', label: 'Front Office' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading staff accounts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No staff accounts match your filter.</div>
        ) : (
          <>
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map((user) => (
              <div key={user.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center shrink-0">
                      {user.name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      {user.phone && <div className="text-[11px] text-slate-500">{user.phone}</div>}
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${roleBadgeClass(user.role)}`}>
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-slate-700 font-medium truncate">{user.branch_name || 'All Branches (HQ)'}</div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {user.salary_type}: ₹{Number(user.base_salary || 0).toLocaleString('en-IN')} · Max Disc ₹{Number(user.max_discount_limit || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  {isSuperAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordTargetUser(user);
                          setIsPasswordModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Password</span>
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(user)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Branch Assignment</th>
                  <th className="py-3.5 px-4">Compensation</th>
                  <th className="py-3.5 px-4">Max Discount</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center shrink-0">
                          {user.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                            {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${roleBadgeClass(user.role)}`}>
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {user.branch_name || 'All Branches (HQ)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 capitalize">{user.salary_type}</div>
                      <div className="text-[11px] text-slate-500">₹{Number(user.base_salary || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      ₹{Number(user.max_discount_limit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
                          title="Edit User & Permissions"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setPasswordTargetUser(user);
                                setIsPasswordModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(user)}
                                className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Create / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>{editingStaff ? `Edit Account: ${editingStaff.name}` : 'Create Staff Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingStaff)}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-500 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">System Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                  >
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    <option value="branch_manager">Branch Manager</option>
                    <option value="instructor">Instructor</option>
                    <option value="office_staff">Office Staff / Counselor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch Assignment</label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    disabled={!isSuperAdmin}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 disabled:bg-slate-50"
                  >
                    <option value="">All Branches (HQ)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                {!editingStaff && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Password</label>
                    <input
                      type="text"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Salary Type & Base (₹)</label>
                  <div className="flex gap-2">
                    <select
                      value={form.salary_type}
                      onChange={(e) => setForm({ ...form, salary_type: e.target.value })}
                      className="h-10 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
                    </select>
                    <input
                      type="number"
                      value={form.base_salary}
                      onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
                      className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Max Discount Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_discount_limit}
                    onChange={(e) => setForm({ ...form, max_discount_limit: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Granular Individual Access Permissions */}
              <div>
                <div className="text-xs font-bold text-slate-800 mb-2">Individual Access Permissions</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PERMISSION_KEYS.map(perm => {
                    const checked = Boolean(form.permissions?.[perm.key]);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          checked ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              permissions: {
                                ...form.permissions,
                                [perm.key]: e.target.checked
                              }
                            })
                          }
                          className="accent-purple-600 rounded"
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordTargetUser(null);
        }}
        targetUser={passwordTargetUser}
      />
    </div>
  );
}

