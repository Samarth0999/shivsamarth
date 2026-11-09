import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, DollarSign, AlertTriangle, TrendingUp, Car, 
  CheckCircle2, ArrowUpRight, MessageSquare, Plus, FileText,
  Calendar, ShieldAlert, Award, Clock
} from 'lucide-react';

export function Dashboard({ onOpenAdmission }) {
  const { 
    currentUser, 
    isSuperAdmin,
    hasPermission,
    selectedBranchId, 
    branches, 
    apiFetch, 
    triggerWhatsAppReminder,
    setActiveTab 
  } = useApp();

  const canAccessExpenses = isSuperAdmin || hasPermission('view_expenses') || hasPermission('edit_expenses');

  const [branchStats, setBranchStats] = useState([]);
  const [day10Students, setDay10Students] = useState([]);
  const [highRiskStudents, setHighRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Fetch branch statistics
        const statsRes = await apiFetch(`/api/branches/stats${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`);
        if (statsRes.stats) setBranchStats(statsRes.stats);

        // Fetch Day 10 students
        const d10Res = await apiFetch(`/api/students?day10Only=true${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`);
        if (d10Res.students) setDay10Students(d10Res.students);

        // Fetch High Risk students
        const riskRes = await apiFetch(`/api/students?risk=HIGH${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`);
        if (riskRes.students) setHighRiskStudents(riskRes.students);

      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [apiFetch, selectedBranchId]);

  // Aggregate stats across authorized branches
  const totalStudents = branchStats.reduce((acc, b) => acc + (b.total_students || 0), 0);
  const activeStudents = branchStats.reduce((acc, b) => acc + (b.active_students || 0), 0);
  const totalRevenue = branchStats.reduce((acc, b) => acc + (b.total_collected || 0), 0);
  const totalPending = branchStats.reduce((acc, b) => acc + (b.total_pending || 0), 0);
  const totalExpenses = branchStats.reduce((acc, b) => acc + (b.total_expenses || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">

      {/* Welcome & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isSuperAdmin ? 'Master Executive Dashboard' : `${currentUser?.branch_name || 'Branch'} Dashboard`}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
              {isSuperAdmin ? 'Multi-Branch Overview' : 'Branch Local Node'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time enrollment progress, financial health, risk matrix, and rotational fleet metrics.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenAdmission}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Admission</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Reports & PDF</span>
          </button>
        </div>
      </div>

      {/* Financial & Operational KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin && canAccessExpenses ? 'lg:grid-cols-4' : (canAccessExpenses || isSuperAdmin) ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
        
        {/* Total Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Fees Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Total actual cash/UPI in bank</span>
          </div>
        </div>

        {/* Pending Fee Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Fees Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Across {activeStudents} active student enrollments
          </div>
        </div>

        {/* Operational Expenses - Only with Access */}
        {canAccessExpenses && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Operational Expenses</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 rotate-180" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              Fuel, repairs, refreshments & RTO
            </div>
          </div>
        )}

        {/* Net Operating Margin - Super Admin Only */}
        {isSuperAdmin && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Net Operating Margin</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-2xl font-black tracking-tight ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                ₹{netProfit.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              Collections minus operational costs
            </div>
          </div>
        )}

      </div>

      {/* Module 7: Day 10 Soft Warning Dashboard Banner */}
      {day10Students.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <span>Day 10 Soft Warning Alerts</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold">
                    {day10Students.length} Students Pending
                  </span>
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  These students have crossed Day 10 of training with an unpaid fee balance. Send automated WhatsApp reminders below:
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('risk')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 shrink-0"
            >
              <span>View Full Risk Matrix</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day 10 Students Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {day10Students.slice(0, 3).map(student => (
              <div key={student.id} className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-amber-200/80 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                      {student.enroll_id}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Day {student.days_completed}/{student.total_course_days}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2">{student.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>{student.branch_name}</span>
                    <span className="font-bold text-rose-600">₹{student.pending_balance} Due</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {student.last_whatsapp_reminder_at ? 'Reminded recently' : 'No reminder sent yet'}
                  </span>
                  <button
                    onClick={() => triggerWhatsAppReminder(student)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Branch Comparison Grid (Module 1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Branch Performance & Financial Isolation</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comparative analytics across authorized operating locations</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {branchStats.length} Branches Active
          </span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Branch Name</th>
                <th className="py-2.5 px-3">Active Students</th>
                <th className="py-2.5 px-3">Fleet Vehicles</th>
                <th className="py-2.5 px-3">Total Collected</th>
                <th className="py-2.5 px-3">Pending Dues</th>
                {canAccessExpenses && <th className="py-2.5 px-3">Expenses</th>}
                {isSuperAdmin && <th className="py-2.5 px-3 text-right">Net Profit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchStats.map(branch => (
                <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{branch.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{branch.code} • {branch.phone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700">{branch.active_students}</span>
                    <span className="text-slate-400 text-[11px]"> / {branch.total_students}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Car className="w-3.5 h-3.5 text-blue-500" />
                      <span>{branch.active_vehicles} active</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-700">
                    ₹{branch.total_collected.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-600">
                    ₹{branch.total_pending.toLocaleString('en-IN')}
                  </td>
                  {canAccessExpenses && (
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      ₹{(branch.total_expenses || 0).toLocaleString('en-IN')}
                    </td>
                  )}
                  {isSuperAdmin && (
                    <td className="py-3 px-3 text-right">
                      <span className={`font-black ${(branch.net_profit || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        ₹{(branch.net_profit || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
