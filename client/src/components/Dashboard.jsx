import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCheck, Users, TrendingUp, Car, ArrowUpRight,
  AlertTriangle, MessageSquare, Building2, CheckCircle2,
  Receipt, BarChart3, UserPlus
} from 'lucide-react';

export function Dashboard({ onOpenAdmission }) {
  const {
    currentUser,
    isSuperAdmin,
    hasPermission,
    selectedBranchId,
    apiFetch,
    triggerWhatsAppReminder,
    setActiveTab
  } = useApp();

  const canAccessExpenses = isSuperAdmin || hasPermission('view_expenses') || hasPermission('edit_expenses');

  const [branchStats, setBranchStats] = useState([]);
  const [day10Students, setDay10Students] = useState([]);
  const [leadsCount, setLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [statsRes, d10Res, leadsRes] = await Promise.all([
          apiFetch(`/api/branches/stats${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`),
          apiFetch(`/api/students?day10Only=true${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`),
          apiFetch('/api/leads').catch(() => ({ leads: [] }))
        ]);

        if (statsRes.stats) setBranchStats(statsRes.stats);
        if (d10Res.students) setDay10Students(d10Res.students);
        if (leadsRes.leads) setLeadsCount(leadsRes.leads.length);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [apiFetch, selectedBranchId]);

  const activeStudents = branchStats.reduce((acc, b) => acc + (b.active_students || 0), 0);
  const totalStudents = branchStats.reduce((acc, b) => acc + (b.total_students || 0), 0);
  const totalRevenue = branchStats.reduce((acc, b) => acc + (b.total_collected || 0), 0);
  const totalPending = branchStats.reduce((acc, b) => acc + (b.total_pending || 0), 0);
  const activeVehicles = branchStats.reduce((acc, b) => acc + (b.active_vehicles || 0), 0);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome to Shivsamarth DSMS — {isSuperAdmin ? 'Multi-Branch Executive Overview' : (currentUser?.branch_name || 'Branch Operations')}
          </p>
        </div>
      </div>

      {/* 4 Crisp KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-purple-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {loading ? '—' : activeStudents}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Active Students</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalStudents} total enrollments recorded
          </div>
        </div>

        {/* Leads Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {loading ? '—' : leadsCount}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Leads in Pipeline</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Website inquiries & demo requests
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {loading ? '—' : `₹${totalRevenue.toLocaleString('en-IN')}`}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Revenue Collected</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ₹{totalPending.toLocaleString('en-IN')} pending receivables
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-orange-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
            <Car className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {loading ? '—' : activeVehicles}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Active Vehicles</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Across {branchStats.length} active branch node(s)
          </div>
        </div>

      </div>

      {/* Quick Actions & Branch Performance Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Add New Lead', icon: UserPlus, onClick: () => setActiveTab('leads') },
              { label: 'Register Student', icon: UserCheck, onClick: onOpenAdmission },
              { label: 'Record Fee Payment', icon: Receipt, onClick: () => setActiveTab('payments') },
              { label: 'Mark Daily Register', icon: CheckCircle2, onClick: () => setActiveTab('attendance') },
              { label: 'View MIS Reports', icon: BarChart3, onClick: () => setActiveTab('reports') }
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50/80 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-100 hover:border-purple-200 transition-colors text-xs font-semibold cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                    <span>{action.label}</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Branch Operations Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Branch Performance Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live enrollments, collections, and fleet across branches</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
              <Building2 className="w-3 h-3" />
              {branchStats.length} Active
            </span>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {branchStats.map(branch => (
              <div key={branch.id} className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{branch.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{branch.code}</div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-semibold text-slate-800">{branch.active_students}</span>
                    <span className="text-slate-400"> / {branch.total_students} students</span>
                    <div className="text-[11px] text-slate-500">{branch.active_vehicles} active vehicles</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="bg-emerald-50/70 rounded-lg px-2.5 py-1.5">
                    <div className="text-[10px] text-emerald-700 font-semibold uppercase">Collected</div>
                    <div className="font-bold text-emerald-700">₹{(branch.total_collected || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-amber-50/70 rounded-lg px-2.5 py-1.5">
                    <div className="text-[10px] text-amber-700 font-semibold uppercase">Pending</div>
                    <div className="font-bold text-amber-600">₹{(branch.total_pending || 0).toLocaleString('en-IN')}</div>
                  </div>
                  {canAccessExpenses && (
                    <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Expenses</div>
                      <div className="font-bold text-slate-700">₹{(branch.total_expenses || 0).toLocaleString('en-IN')}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Students</th>
                  <th className="py-2.5 px-3">Vehicles</th>
                  <th className="py-2.5 px-3">Collected</th>
                  <th className="py-2.5 px-3">Pending</th>
                  {canAccessExpenses && <th className="py-2.5 px-3 text-right">Expenses</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchStats.map(branch => (
                  <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{branch.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{branch.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{branch.active_students}</span>
                      <span className="text-slate-400"> / {branch.total_students}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {branch.active_vehicles} active
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">
                      ₹{(branch.total_collected || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-amber-600">
                      ₹{(branch.total_pending || 0).toLocaleString('en-IN')}
                    </td>
                    {canAccessExpenses && (
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        ₹{(branch.total_expenses || 0).toLocaleString('en-IN')}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Day 10 Fee Alert Strip */}
      {day10Students.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-950">
                  Day 10 Fee Warning Alerts ({day10Students.length})
                </h3>
                <p className="text-xs text-amber-800/80">
                  Students crossing Day 10 with unpaid balance. Send quick WhatsApp reminders.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('risk')}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Open Risk & Alerts</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {day10Students.slice(0, 3).map(student => (
              <div key={student.id} className="bg-white p-3.5 rounded-xl border border-amber-200/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{student.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Day {student.days_completed}/{student.total_course_days} • <span className="text-rose-600 font-semibold">₹{student.pending_balance} due</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerWhatsAppReminder(student)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Remind</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
