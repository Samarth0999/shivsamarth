import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  AlertTriangle, MessageSquare, Phone, ShieldAlert, 
  DollarSign, Clock, Calendar, CheckCircle, ChevronRight, FileText
} from 'lucide-react';
import { exportDefaultersPDF } from '../utils/pdfGenerator';

export function RiskMatrixView() {
  const { 
    currentUser, 
    selectedBranchId, 
    apiFetch, 
    triggerWhatsAppReminder, 
    settings,
    showToast 
  } = useApp();

  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'DAY10' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [loading, setLoading] = useState(true);

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      let url = `/api/students?1=1`;
      if (selectedBranchId) url += `&branchId=${selectedBranchId}`;

      const res = await apiFetch(url);
      if (res.students) {
        // Only interested in students with pending balances
        setStudents(res.students.filter(s => s.pending_balance > 0));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, [selectedBranchId]);

  // Filter students
  const filteredStudents = students.filter(s => {
    if (filter === 'DAY10') return s.isDay10Warning;
    if (filter === 'HIGH') return s.riskLevel === 'HIGH';
    if (filter === 'MEDIUM') return s.riskLevel === 'MEDIUM';
    if (filter === 'LOW') return s.riskLevel === 'LOW';
    return true;
  });

  const day10Count = students.filter(s => s.isDay10Warning).length;
  const highRiskCount = students.filter(s => s.riskLevel === 'HIGH').length;
  const mediumRiskCount = students.filter(s => s.riskLevel === 'MEDIUM').length;
  const lowRiskCount = students.filter(s => s.riskLevel === 'LOW').length;
  const totalPendingDues = students.reduce((sum, s) => sum + s.pending_balance, 0);

  // Export PDF
  const handleExportPDF = () => {
    const reportData = {
      total_defaulters: filteredStudents.length,
      total_pending_amount: filteredStudents.reduce((sum, s) => sum + s.pending_balance, 0),
      risk_summary: {
        high_risk: highRiskCount,
        medium_risk: mediumRiskCount,
        low_risk: lowRiskCount
      },
      records: filteredStudents
    };

    exportDefaultersPDF(reportData, {
      schoolName: settings.app_name,
      branchName: currentUser?.branch_name
    });
    showToast('Pending Fees & Defaulters Risk Report PDF generated!');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Financial Risk Matrix & Day 10 Reminders</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
              ₹{totalPendingDues.toLocaleString('en-IN')} Total At Risk
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Module 7: Dynamic risk formula based on remaining training days vs fee clearance percentage, with 1-click WhatsApp alerts.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>Export Defaulters PDF</span>
        </button>
      </div>

      {/* Summary Risk Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Day 10 Soft Warning */}
        <div 
          onClick={() => setFilter('DAY10')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'DAY10' ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold text-amber-700">
            <span>Day 10 Soft Warnings</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{day10Count}</div>
          <p className="text-[11px] text-amber-700/80 mt-1">Reached Day 10 with unpaid dues</p>
        </div>

        {/* High Risk */}
        <div 
          onClick={() => setFilter('HIGH')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'HIGH' ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-400' : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold text-rose-700">
            <span>High Risk Defaulters</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-2">{highRiskCount}</div>
          <p className="text-[11px] text-rose-700/80 mt-1">Remaining Days ≤ 5 and Balance &gt; 0</p>
        </div>

        {/* Medium Risk */}
        <div 
          onClick={() => setFilter('MEDIUM')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'MEDIUM' ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold text-amber-700">
            <span>Medium Risk</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-800 mt-2">{mediumRiskCount}</div>
          <p className="text-[11px] text-amber-700/80 mt-1">Remaining 6–14 Days and &lt; 50% paid</p>
        </div>

        {/* Low Risk */}
        <div 
          onClick={() => setFilter('LOW')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'LOW' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold text-emerald-700">
            <span>Low Risk</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2">{lowRiskCount}</div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Remaining Days ≥ 15</p>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          All Defaulters ({students.length})
        </button>
        <button
          onClick={() => setFilter('DAY10')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'DAY10' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-50'}`}
        >
          Day 10 Warnings ({day10Count})
        </button>
        <button
          onClick={() => setFilter('HIGH')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'HIGH' ? 'bg-rose-600 text-white' : 'text-rose-800 hover:bg-rose-50'}`}
        >
          High Risk ({highRiskCount})
        </button>
        <button
          onClick={() => setFilter('MEDIUM')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'MEDIUM' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-50'}`}
        >
          Medium Risk ({mediumRiskCount})
        </button>
        <button
          onClick={() => setFilter('LOW')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'LOW' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'}`}
        >
          Low Risk ({lowRiskCount})
        </button>
      </div>

      {/* Table of Defaulters */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Student & Enroll ID</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Training Status</th>
                <th className="py-3 px-3">Remaining Days</th>
                <th className="py-3 px-3">Pending Balance</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-4 text-right">Reminder Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{student.name}</div>
                    <div className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">{student.enroll_id}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono text-slate-800 font-semibold">{student.phone}</div>
                    <div className="text-[11px] text-slate-400">{student.branch_name}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800">
                      Day {student.days_completed}/{student.total_course_days}
                    </span>
                    {student.isDay10Warning && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        DAY 10 FLAG
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-black text-sm text-slate-800">
                      {student.remainingDays} days left
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-black text-rose-600 text-sm">
                      ₹{student.pending_balance.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Paid: ₹{student.total_paid} / ₹{student.net_total_fee}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      student.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {student.riskLevel} Risk
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => triggerWhatsAppReminder(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      title="Send WhatsApp Fee Reminder"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Reminder</span>
                    </button>
                  </td>

                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No defaulters found matching this filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
