import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardList, Plus, Search, Award, CheckCircle2,
  Clock, ShieldCheck, IndianRupee, FileText
} from 'lucide-react';

export function AdmissionsView({ onOpenAdmission, onOpenStudent }) {
  const { selectedBranchId, apiFetch, showToast } = useApp();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rtoFilter, setRtoFilter] = useState('all'); // 'all' | 'ready' | 'pending'

  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranchId) params.set('branchId', selectedBranchId);
      if (search.trim()) params.set('search', search.trim());
      const res = await apiFetch(`/api/students?${params.toString()}`);
      setStudents(res.students || []);
    } catch (err) {
      showToast(err.message || 'Failed to load admissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, selectedBranchId, search, showToast]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const filtered = students.filter(s => {
    if (rtoFilter === 'ready') return s.isRtoGateUnlocked;
    if (rtoFilter === 'pending') return !s.isRtoGateUnlocked;
    return true;
  });

  const totalNetFees = students.reduce((sum, s) => sum + (s.net_total_fee || 0), 0);
  const rtoReadyCount = students.filter(s => s.isRtoGateUnlocked).length;
  const llIssuedCount = students.filter(s => Boolean(s.ll_application_no)).length;
  const dlIssuedCount = students.filter(s => Boolean(s.dl_number)).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-purple-600" />
            <span>Admissions & Course Enrollments</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create sequential admissions, manage fee snapshots, and track RTO license progress.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdmission}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/20 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Admission</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{students.length}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Sequential Enrollments</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{totalNetFees.toLocaleString('en-IN')}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Net Course Fee Snapshot</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{llIssuedCount} / {dlIssuedCount}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">LL Apps / DL Numbers</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{rtoReadyCount}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">RTO Test Gate Unlocked</div>
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
            placeholder="Search by enroll ID, student name, or phone..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Enrollments' },
            { id: 'ready', label: 'RTO Gate Unlocked' },
            { id: 'pending', label: 'In Progress' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRtoFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                rtoFilter === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sequential Admissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading course enrollments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No enrollments found. Click <span className="font-semibold text-purple-600">+ New Admission</span> to create one.
          </div>
        ) : (
          <>
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map(s => (
              <div key={s.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {s.enroll_id}
                      </span>
                      <span className="text-[11px] text-slate-400">{s.admission_date}</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-1 truncate">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.phone} · {s.branch_name || 'Main Branch'}</div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      s.isRtoGateUnlocked
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {s.isRtoGateUnlocked ? 'RTO Ready' : 'Training'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3 py-2">
                  <div>
                    <div className="font-semibold text-slate-800">{s.course_name}</div>
                    <div className="text-[11px] text-slate-500">
                      Progress: {s.days_completed || 0}/{s.total_course_days || 0} days
                      {s.dl_number ? ` · DL ${s.dl_number}` : s.ll_application_no ? ` · LL ${s.ll_application_no}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="text-xs space-x-2">
                    <span className="text-slate-500">Fee: <strong className="text-slate-900">₹{(s.net_total_fee || 0).toLocaleString('en-IN')}</strong></span>
                    <span className="text-emerald-700">Paid: <strong>₹{(s.total_paid || 0).toLocaleString('en-IN')}</strong></span>
                    {(s.pending_balance || 0) > 0 && (
                      <span className="text-amber-600">Due: <strong>₹{(s.pending_balance || 0).toLocaleString('en-IN')}</strong></span>
                    )}
                  </div>
                  {onOpenStudent && (
                    <button
                      type="button"
                      onClick={onOpenStudent}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      Manage →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Enroll ID & Date</th>
                  <th className="py-3.5 px-4">Student & Branch</th>
                  <th className="py-3.5 px-4">Course Package</th>
                  <th className="py-3.5 px-4">Fee Snapshot</th>
                  <th className="py-3.5 px-4">RTO Progress</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {s.enroll_id}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">{s.admission_date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.phone} • {s.branch_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 max-w-[220px] truncate">{s.course_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Day {s.days_completed}/{s.total_course_days}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        Net: ₹{(s.net_total_fee || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Paid: ₹{(s.total_paid || 0).toLocaleString('en-IN')}
                        {s.pending_balance > 0 && (
                          <span className="text-rose-600 font-semibold ml-1.5">
                            (Due ₹{s.pending_balance.toLocaleString('en-IN')})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        {s.isRtoGateUnlocked ? (
                          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            RTO Test Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                            <Clock className="w-3 h-3" />
                            Training / Fee Gate
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          {s.dl_number ? `DL: ${s.dl_number}` : s.ll_application_no ? `LL: ${s.ll_application_no}` : 'No LL/DL recorded'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={onOpenStudent}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

