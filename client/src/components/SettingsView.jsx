import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings, Sliders, Shield, Award, DollarSign,
  Receipt, Save, Plus, CheckCircle, AlertTriangle, Users,
  ToggleLeft, ToggleRight, Edit, Trash2, X, Check, MapPin, Navigation,
  Building2, ArrowRight, ExternalLink, Star, Flame, Cloud
} from 'lucide-react';

export function SettingsView() {
  const {
    currentUser,
    isSuperAdmin,
    settings,
    setSettings,
    courseTypes,
    paymentModes,
    expenseCategories,
    branches,
    apiFetch,
    showToast,
    loadInitialData,
    setActiveTab: setPortalTab,
    isFirebaseConfigured
  } = useApp();

  const [activeTab, setActiveTab] = useState('branches'); // 'branches' | 'thresholds' | 'categories'
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);

  // Clear All Data Danger Zone state
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearingData, setIsClearingData] = useState(false);

  const handleClearAllData = async (e) => {
    e.preventDefault();
    if (clearConfirmText.trim().toUpperCase() !== 'CONFIRM') {
      showToast('Please type "CONFIRM" to authorize data wipe', 'error');
      return;
    }
    setIsClearingData(true);
    try {
      const res = await apiFetch('/api/settings/clear-all-data', {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'CONFIRM' })
      });
      if (res.success) {
        showToast(res.message || 'All application data has been cleared!');
        setIsClearDataModalOpen(false);
        setClearConfirmText('');
        loadInitialData(currentUser?.id);
      } else {
        throw new Error(res.error || 'Failed to clear data');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleSyncFirebase = async () => {
    setIsSyncingFirebase(true);
    try {
      const res = await apiFetch('/api/settings/sync-firebase', { method: 'POST' });
      if (res.success) {
        showToast('All tables and data successfully backed up to Firebase Cloud Firestore!');
      } else {
        throw new Error(res.error || 'Sync failed');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Dynamic Settings form
  const [formSettings, setFormSettings] = useState({
    day_10_warning_threshold: settings.day_10_warning_threshold || '10',
    risk_low_remaining_days: settings.risk_low_remaining_days || '15',
    risk_high_remaining_days: settings.risk_high_remaining_days || '5',
    geofence_radius_meters: settings.geofence_radius_meters || '100',
    app_name: settings.app_name || 'ShivSamarth Motor Driving School',
    whatsapp_fee_reminder_template: settings.whatsapp_fee_reminder_template || '',
    google_review_url: settings.google_review_url || 'https://g.page/r/shivsamarth-driving-school/review',
    google_review_trigger_days: settings.google_review_trigger_days || '3',
    whatsapp_google_review_template: settings.whatsapp_google_review_template || ''
  });

  // Payment Modes state & inline editing
  const [newModeName, setNewModeName] = useState('');
  const [editingModeId, setEditingModeId] = useState(null);
  const [editingModeName, setEditingModeName] = useState('');

  // Expense Categories state & inline editing
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Branches state & management (Module 1)
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [newBranch, setNewBranch] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    latitude: '18.9904',
    longitude: '75.7607',
    google_review_url: ''
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
          longitude: parseFloat(newBranch.longitude) || 0,
          google_review_url: newBranch.google_review_url ? newBranch.google_review_url.trim() : null
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
        longitude: '75.7607',
        google_review_url: ''
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
          longitude: parseFloat(editingBranch.longitude) || 0,
          google_review_url: editingBranch.google_review_url !== undefined ? editingBranch.google_review_url.trim() : null
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
      app_name: settings.app_name || 'ShivSamarth Motor Driving School',
      whatsapp_fee_reminder_template: settings.whatsapp_fee_reminder_template || '',
      google_review_url: settings.google_review_url || 'https://g.page/r/shivsamarth-driving-school/review',
      google_review_trigger_days: settings.google_review_trigger_days || '3',
      whatsapp_google_review_template: settings.whatsapp_google_review_template || ''
    });
  }, [settings]);

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
  // 1. PAYMENT MODES ACTIONS (Add, Edit, Delete)
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

  return (
    <div className="space-y-6">

      {/* Header (System Administration & Settings) */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Administration & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure multi-branch infrastructure, role-based access control, and user directory.
        </p>
      </div>

      {/* Firebase Cloud Infrastructure Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border border-amber-300/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span>Firebase Cloud Infrastructure</span>
              </h4>
              {isFirebaseConfigured ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected &amp; Active
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                    <Cloud className="w-3 h-3 text-blue-600" />
                    Auto-Sync Active (Realtime Cloud Sync)
                  </span>
                </div>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  Ready for Credentials
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Project ID: <span className="font-mono font-semibold text-slate-800">shivsamarth-51326</span> • Cloud Firestore (Auto-Sync On) • Firebase Authentication • Cloud Storage
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Firestore DB: Ready
          </span>
          <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Auth: Ready
          </span>
          <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Storage: Ready
          </span>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleSyncFirebase}
              disabled={isSyncingFirebase}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
              title="Manually trigger immediate full cloud backup of all tables to Firebase Firestore"
            >
              {isSyncingFirebase ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>Sync All to Firebase</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Administration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Branch Management */}
        <div
          onClick={() => setActiveTab('branches')}
          className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between ${activeTab === 'branches' ? 'border-purple-500 ring-2 ring-purple-100 shadow-sm' : 'border-slate-200/80 hover:border-purple-200'
            }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">
                {branches.length} {branches.length === 1 ? 'Branch' : 'Branches'} Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Branch Management</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Manage driving school locations, GPS coordinates, and contact details.
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600">
            <span>Configure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Operational Thresholds & WhatsApp */}
        <div
          onClick={() => setActiveTab('thresholds')}
          className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between ${activeTab === 'thresholds' ? 'border-purple-500 ring-2 ring-purple-100 shadow-sm' : 'border-slate-200/80 hover:border-purple-200'
            }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
                Automation
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Thresholds &amp; WhatsApp</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Configure Day 10 fee reminders, geofence radius, and automated review templates.
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600">
            <span>Configure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Payment & Expense Modes */}
        <div
          onClick={() => setActiveTab('categories')}
          className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between ${activeTab === 'categories' ? 'border-purple-500 ring-2 ring-purple-100 shadow-sm' : 'border-slate-200/80 hover:border-purple-200'
            }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                {paymentModes.length} Modes · {expenseCategories.length} Tags
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Payment &amp; Expense Modes</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Configure accepted payment methods (UPI, Cash) and operational expense tags.
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600">
            <span>Configure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
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

                  {/* Branch Google Review Link */}
                  <div className="mt-2.5 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Google Reviews:</span>
                      </span>
                      {b.google_review_url ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Branch Link</span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Global Fallback</span>
                      )}
                    </div>
                    {b.google_review_url ? (
                      <a
                        href={b.google_review_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-mono truncate"
                        title={b.google_review_url}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{b.google_review_url}</span>
                      </a>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">
                        Using global review link configured in Thresholds & WhatsApp tab.
                      </p>
                    )}
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

            {/* Google Review URL Fallback */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>Global Fallback Google Review Link</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">Fallback</span>
              </label>
              <input
                type="url"
                placeholder="https://g.page/r/your-google-review-link/review"
                value={formSettings.google_review_url}
                onChange={e => setFormSettings({ ...formSettings, google_review_url: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-xs text-slate-800"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default review URL used if a student's branch has no specific link configured.</p>
            </div>

            {/* Google Review Trigger Threshold */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">
                Course Completion Review Trigger (Days Remaining)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formSettings.google_review_trigger_days}
                onChange={e => setFormSettings({ ...formSettings, google_review_trigger_days: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-1">Triggers review prompt when remaining course days &le; this number (e.g. 3 days before finish)</p>
            </div>

            {/* Branch-Wise Google Review URLs Card */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>Branch-Wise Google Business Profile Review Links</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Review invitations sent to students automatically direct to the Google Review URL of the branch they are enrolled in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('branches')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs shrink-0 self-start sm:self-auto"
                >
                  Manage Branch Links
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {branches.map(b => (
                  <div key={b.id} className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        {b.name} ({b.code})
                      </span>
                      {b.google_review_url ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Branch URL Configured</span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Using Global Fallback</span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-600 truncate">
                      {b.google_review_url || formSettings.google_review_url || 'No URL configured'}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBranch(b);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit Review URL
                      </button>
                      {(b.google_review_url || formSettings.google_review_url) && (
                        <a
                          href={b.google_review_url || formSettings.google_review_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Test Review Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Google Review Template */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>WhatsApp Google Review Invitation Template</span>
                <span className="text-[11px] text-purple-700 font-semibold">Course Completion Message</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Available tags: <code className="bg-slate-200 px-1 py-0.5 rounded">{`{student_name}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{school_name}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{branch_name}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{course_name}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{days_completed}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{total_days}`}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">{`{google_review_link}`}</code>
              </p>
              <textarea
                rows={4}
                value={formSettings.whatsapp_google_review_template}
                onChange={e => setFormSettings({ ...formSettings, whatsapp_google_review_template: e.target.value })}
                placeholder="Congratulations on nearing completion of your driving training! Please share a 5-star Google review..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 2. CATEGORIES & PAYMENT MODES (Editable & Deletable) */}
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

      {/* DANGER ZONE: Reset Application Data (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 shadow-2xs mt-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                    <span>Danger Zone: Clear All Application Data</span>
                    <span className="text-[10px] bg-rose-200/80 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                      Super Admin Only
                    </span>
                  </h3>
                </div>
              </div>
              <p className="text-xs text-rose-800/80 max-w-2xl leading-relaxed">
                Permanently purge all students, fee collections, attendance history, operational expenses, CRM leads, and staff accounts from both the local database and Firebase Cloud Firestore.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Safe &amp; Protected:</strong> The Owner account (<span className="font-mono font-semibold">owner@shivsamarth.com</span>) and branch setup are preserved.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setClearConfirmText('');
                setIsClearDataModalOpen(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data...</span>
            </button>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Google Business Profile Review Link</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://g.page/r/shivsamarth-branch/review"
                  value={newBranch.google_review_url || ''}
                  onChange={e => setNewBranch({ ...newBranch, google_review_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Direct review link for this branch location. Leave blank to inherit system global review URL.
                </p>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Google Business Profile Review Link</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">Branch-specific</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://g.page/r/shivsamarth-branch/review"
                  value={editingBranch.google_review_url || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, google_review_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  WhatsApp completion invites sent to students in this branch will use this direct Google Review link.
                </p>
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

      {/* CLEAR ALL DATA CONFIRMATION MODAL */}
      {isClearDataModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Confirm Full Application Reset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isClearingData && setIsClearDataModalOpen(false)}
                disabled={isClearingData}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClearAllData} className="space-y-4 mt-4 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <p className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>This action is irreversible and permanent!</span>
                </p>
                <ul className="text-[11px] text-rose-800 space-y-1 list-disc list-inside">
                  <li>All student records &amp; documents will be permanently deleted.</li>
                  <li>All fee payment histories &amp; invoices will be erased.</li>
                  <li>All student &amp; staff attendance logs will be wiped.</li>
                  <li>All staff accounts, advances &amp; payroll records will be removed.</li>
                  <li>All expense entries &amp; CRM leads will be deleted.</li>
                  <li>Both local SQLite database and Cloud Firestore will be wiped.</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Preserved:</strong> The Super Admin Owner account (<span className="font-mono font-semibold">owner@shivsamarth.com</span>) and branch setup will remain intact so you can immediately begin fresh.
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-slate-800">
                  To confirm, type <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold select-all">CONFIRM</span> below:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type CONFIRM"
                  value={clearConfirmText}
                  onChange={e => setClearConfirmText(e.target.value)}
                  disabled={isClearingData}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClearDataModalOpen(false)}
                  disabled={isClearingData}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clearConfirmText.trim().toUpperCase() !== 'CONFIRM' || isClearingData}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isClearingData ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Clearing All Data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Wipe All Data</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
