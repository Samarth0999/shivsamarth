import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCog, Plus, Search, Shield, Edit,
  KeyRound, X, Building2, Phone, Mail, Save,
  UserCheck, UserX
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { RBAC_CATEGORIES, DEFAULT_ROLE_PERMISSIONS } from '../utils/rbacConfig';

const LOCAL_STAFF_KEY = 'dsms_persisted_staff';

export function StaffView() {
  const {
    currentUser,
    isSuperAdmin,
    branches,
    selectedBranchId,
    apiFetch,
    showToast,
    loadInitialData
  } = useApp();

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

  // Role & Permission Matrix Control Modal
  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);
  const [selectedRbacUser, setSelectedRbacUser] = useState(null);
  const [rbacPermissions, setRbacPermissions] = useState({});
  const [rbacDiscountLimit, setRbacDiscountLimit] = useState(0);
  const [savingRbac, setSavingRbac] = useState(false);

  // Resilient loadStaff: Fetches from backend and maintains persistent localStorage fallback
  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Read existing locally persisted staff cache
      let localStaff = [];
      try {
        const raw = localStorage.getItem(LOCAL_STAFF_KEY);
        if (raw) localStaff = JSON.parse(raw);
      } catch (e) {}

      // 2. Fetch from backend
      const res = await apiFetch('/api/auth/users');
      let serverUsers = res.users || [];

      // 3. Find any custom staff in localStaff that is missing from server (e.g. serverless cold start)
      const serverEmails = new Set(serverUsers.map(u => (u.email || '').toLowerCase().trim()));
      const missingStaff = localStaff.filter(u =>
        u.email &&
        u.role !== 'super_admin' &&
        !serverEmails.has(u.email.toLowerCase().trim())
      );

      // Re-sync missing staff back to server
      if (missingStaff.length > 0) {
        for (const staffMember of missingStaff) {
          try {
            await apiFetch('/api/auth/users', {
              method: 'POST',
              body: JSON.stringify({
                name: staffMember.name,
                email: staffMember.email,
                phone: staffMember.phone,
                role: staffMember.role,
                branch_id: staffMember.branch_id,
                salary_type: staffMember.salary_type,
                base_salary: staffMember.base_salary,
                max_discount_limit: staffMember.max_discount_limit,
                permissions: staffMember.permissions,
                is_active: staffMember.is_active !== undefined ? staffMember.is_active : 1
              })
            });
          } catch (syncErr) {
            console.warn('Staff re-sync note:', syncErr.message);
          }
        }

        try {
          const refreshed = await apiFetch('/api/auth/users');
          if (refreshed.users) serverUsers = refreshed.users;
        } catch (e) {}
      }

      // 4. Merge server users with local cache (unique by email or id)
      const rosterMap = new Map();
      serverUsers.forEach(u => {
        const key = (u.email || String(u.id)).toLowerCase().trim();
        rosterMap.set(key, u);
      });
      localStaff.forEach(u => {
        const key = (u.email || String(u.id)).toLowerCase().trim();
        if (!rosterMap.has(key)) {
          rosterMap.set(key, u);
        } else {
          const existing = rosterMap.get(key);
          rosterMap.set(key, { ...u, ...existing });
        }
      });

      const finalRoster = Array.from(rosterMap.values());
      try {
        localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(finalRoster));
      } catch (e) {}
      setStaff(finalRoster);
    } catch (err) {
      // Fallback to locally stored staff roster if network fails
      try {
        const raw = localStorage.getItem(LOCAL_STAFF_KEY);
        if (raw) setStaff(JSON.parse(raw));
      } catch (e) {}
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
      permissions: { ...DEFAULT_ROLE_PERMISSIONS.instructor }
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
      permissions: user.permissions || {}
    });
    setIsModalOpen(true);
  };

  const handleToggleStaffStatus = async (user) => {
    if (user.role === 'super_admin') {
      showToast('Super Admin account must remain active.', 'error');
      return;
    }

    const nextStatus = user.is_active ? 0 : 1;
    const actionLabel = nextStatus ? 'activated' : 'deactivated';

    try {
      await apiFetch(`/api/auth/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: nextStatus })
      });

      // Update local storage cache
      try {
        const raw = localStorage.getItem(LOCAL_STAFF_KEY);
        if (raw) {
          const list = JSON.parse(raw).map(u =>
            u.id === user.id ? { ...u, is_active: nextStatus } : u
          );
          localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(list));
        }
      } catch (e) {}

      showToast(`Staff member "${user.name}" is now ${nextStatus ? 'Active' : 'Inactive'}.`);
      await loadStaff();
      if (loadInitialData) await loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message || `Failed to ${actionLabel} staff account`, 'error');
    }
  };

  const openPermissionsModal = (user) => {
    setSelectedRbacUser(user);
    setRbacPermissions(user.permissions || {});
    setRbacDiscountLimit(user.max_discount_limit || 0);
    setIsRbacModalOpen(true);
  };

  const handleGrantAll = () => {
    const all = {};
    RBAC_CATEGORIES.forEach(cat => {
      cat.switches.forEach(sw => {
        all[sw.key] = true;
      });
    });
    setRbacPermissions(all);
  };

  const handleRevokeAll = () => {
    const none = {};
    RBAC_CATEGORIES.forEach(cat => {
      cat.switches.forEach(sw => {
        none[sw.key] = false;
      });
    });
    setRbacPermissions(none);
  };

  const handleApplyRoleDefaults = (role) => {
    const defaults = DEFAULT_ROLE_PERMISSIONS[role] || {};
    setRbacPermissions({ ...defaults });
    showToast(`Applied default permissions for ${role.replace('_', ' ')}!`, 'info');
  };

  const handleSaveRBAC = async () => {
    if (!selectedRbacUser) return;
    setSavingRbac(true);
    try {
      await apiFetch(`/api/auth/users/${selectedRbacUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          permissions: rbacPermissions,
          max_discount_limit: Number(rbacDiscountLimit || 0)
        })
      });

      // Update local storage cache
      try {
        const raw = localStorage.getItem(LOCAL_STAFF_KEY);
        if (raw) {
          const list = JSON.parse(raw).map(u =>
            u.id === selectedRbacUser.id
              ? { ...u, permissions: rbacPermissions, max_discount_limit: Number(rbacDiscountLimit || 0) }
              : u
          );
          localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(list));
        }
      } catch (e) {}

      showToast(`Privileges and discount limits updated for ${selectedRbacUser.name}!`);
      setIsRbacModalOpen(false);
      await loadStaff();
      if (loadInitialData) await loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message || 'Failed to update privileges', 'error');
    } finally {
      setSavingRbac(false);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
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
        const res = await apiFetch(`/api/auth/users/${editingStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        // Also update local cache
        try {
          const raw = localStorage.getItem(LOCAL_STAFF_KEY);
          if (raw) {
            const list = JSON.parse(raw).map(u =>
              u.id === editingStaff.id ? { ...u, ...payload, ...(res.user || {}) } : u
            );
            localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(list));
          }
        } catch (e) {}

        showToast('Staff account & permissions updated!');
      } else {
        const res = await apiFetch('/api/auth/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        // Store in local persistence cache
        try {
          const raw = localStorage.getItem(LOCAL_STAFF_KEY);
          const currentList = raw ? JSON.parse(raw) : [];
          if (res.user) {
            currentList.push({ ...res.user, ...payload });
            localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(currentList));
          }
        } catch (e) {}

        showToast('Staff account created successfully!');
      }

      setIsModalOpen(false);
      await loadStaff();
      if (loadInitialData) await loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message || 'Failed to save staff account', 'error');
    } finally {
      setSubmitting(false);
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

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {(isSuperAdmin || currentUser?.role === 'branch_manager') && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedRbacUser(staff[0] || null);
                  setRbacPermissions(staff[0]?.permissions || {});
                  setRbacDiscountLimit(staff[0]?.max_discount_limit || 0);
                  setIsRbacModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Role &amp; Permission Control</span>
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Account</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Role Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Team</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{staff.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active staff accounts</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admins &amp; Managers</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">
            {staff.filter(u => u.role === 'super_admin' || u.role === 'branch_manager').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Leadership &amp; oversight</div>
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
          <div className="text-[11px] text-slate-500 mt-0.5">Counselors &amp; cashiers</div>
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
          {/* Mobile Roster Cards */}
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${roleBadgeClass(user.role)}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                    {isSuperAdmin && user.role !== 'super_admin' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleStaffStatus(user)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold cursor-pointer transition-colors ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title={user.is_active ? 'Click to mark Inactive' : 'Click to mark Active'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-slate-700 font-medium truncate">{user.branch_name || 'All Branches (HQ)'}</div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {user.salary_type}: ₹{Number(user.base_salary || 0).toLocaleString('en-IN')} · Max Disc ₹{Number(user.max_discount_limit || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-0.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openPermissionsModal(user)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Role & Permission Control"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Permissions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {isSuperAdmin && (
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
                  )}

                  {isSuperAdmin && user.role !== 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => handleToggleStaffStatus(user)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        user.is_active
                          ? 'bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border-emerald-200'
                          : 'bg-rose-50 hover:bg-emerald-50 text-rose-700 hover:text-emerald-700 border-rose-200'
                      }`}
                      title={user.is_active ? 'Deactivate staff account' : 'Activate staff account'}
                    >
                      {user.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                      <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Roster Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
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
                    <td className="py-3.5 px-4">
                      {isSuperAdmin && user.role !== 'super_admin' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={user.is_active ? 'Click to mark Inactive' : 'Click to mark Active'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      )}
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
                          onClick={() => openPermissionsModal(user)}
                          className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                          title="Role & Permission Control"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Edit User Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && (
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
                        )}
                        {isSuperAdmin && user.role !== 'super_admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStaffStatus(user)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer border ${
                              user.is_active
                                ? 'bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border-emerald-200'
                                : 'bg-rose-50 hover:bg-emerald-50 text-rose-700 hover:text-emerald-700 border-rose-200'
                            }`}
                            title={user.is_active ? 'Deactivate staff account' : 'Activate staff account'}
                          >
                            {user.is_active ? <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> : <UserX className="w-3.5 h-3.5 text-rose-600" />}
                          </button>
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

      {/* Create / Edit Staff Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-purple-600" />
                <span>{editingStaff ? `Edit Account: ${editingStaff.name}` : 'Create New Staff Account'}</span>
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
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Staff can use this email for portal login and Google Sign-In.</p>
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
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setForm({
                        ...form,
                        role: newRole,
                        permissions: { ...(DEFAULT_ROLE_PERMISSIONS[newRole] || {}) }
                      });
                    }}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Salary Type &amp; Base (₹)</label>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Status</label>
                  <select
                    value={form.is_active}
                    disabled={editingStaff?.role === 'super_admin'}
                    onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 disabled:bg-slate-50"
                  >
                    <option value={1}>Active Staff</option>
                    <option value={0}>Inactive (Access Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Permissions for selected role */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-800">Operational Role Permissions</div>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    Configured for {form.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-[11px] text-slate-600">
                  Granular permission switches and financial thresholds can also be fine-tuned via the dedicated <strong>Role &amp; Permission Control</strong> button on the staff roster.
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Role & Permission Control Modal */}
      {isRbacModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/80 via-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Role &amp; Permission Control
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure granular operational privileges, financial discounts, and access matrices.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRbacModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Target Staff Member Selector */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target Staff Member
                  </label>
                  <select
                    value={selectedRbacUser?.id || ''}
                    onChange={(e) => {
                      const u = staff.find(x => x.id === Number(e.target.value));
                      if (u) {
                        setSelectedRbacUser(u);
                        setRbacPermissions(u.permissions || {});
                        setRbacDiscountLimit(u.max_discount_limit || 0);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-bold text-xs sm:text-sm text-slate-900 focus:border-purple-500 outline-none"
                  >
                    {staff.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — ({u.role.replace('_', ' ').toUpperCase()}) • {u.branch_name || 'All Branches'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500">Presets:</span>
                  {['instructor', 'branch_manager', 'office_staff'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleApplyRoleDefaults(role)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-200 text-slate-700 hover:text-purple-700 text-[11px] font-semibold capitalize transition-colors cursor-pointer"
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Privileges & Max Discount */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      Financial Privilege: Max Authorized Discount (₹)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Restricts the maximum fee discount this staff member can issue during student admission.
                    </p>
                  </div>
                  <div className="w-full sm:w-48">
                    <input
                      type="number"
                      min="0"
                      value={rbacDiscountLimit}
                      onChange={(e) => setRbacDiscountLimit(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-bold font-mono text-sm text-slate-900 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Functional Permission Categories Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Granular Operational Capabilities
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGrantAll}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Grant All
                    </button>
                    <button
                      type="button"
                      onClick={handleRevokeAll}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  {RBAC_CATEGORIES.map(group => (
                    <div key={group.category} className="space-y-2">
                      <div className="text-xs font-bold text-purple-900 bg-purple-50/80 px-3 py-1.5 rounded-xl border border-purple-100">
                        {group.category}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {group.switches.map(sw => {
                          const isChecked = Boolean(rbacPermissions?.[sw.key]);
                          return (
                            <label
                              key={sw.key}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-purple-50/40 border-purple-200'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setRbacPermissions({
                                    ...rbacPermissions,
                                    [sw.key]: e.target.checked
                                  })
                                }
                                className="mt-0.5 accent-purple-600 rounded w-4 h-4 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900">
                                  {sw.label}
                                </div>
                                <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                  {sw.desc}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Configuring: <strong className="text-slate-800">{selectedRbacUser?.name}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRbacModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRBAC}
                  disabled={savingRbac}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-60 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingRbac ? 'Saving Privileges...' : 'Save Privileges'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
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
