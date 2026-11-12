import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, Download, Calendar, Filter, 
  DollarSign, AlertTriangle, Receipt, ArrowRight, BarChart3, TrendingUp, Users
} from 'lucide-react';
import { 
  exportFeesCollectionPDF, 
  exportDefaultersPDF, 
  exportExpensesPDF 
} from '../utils/pdfGenerator';

export function ReportsView() {
  const { currentUser, isSuperAdmin, hasPermission, selectedBranchId, apiFetch, settings, showToast } = useApp();

  const canAccessExpenses = isSuperAdmin || hasPermission('view_expenses') || hasPermission('edit_expenses');
  const [activeReport, setActiveReport] = useState('fees'); // 'fees' | 'defaulters' | 'expenses'
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly' | 'monthly' | 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [misSummary, setMisSummary] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    totalStudents: 0,
    totalCollected: 0,
    totalPending: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMisSummary() {
      try {
        const [statsRes, leadsRes] = await Promise.all([
          apiFetch(`/api/branches/stats${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`),
          apiFetch('/api/leads').catch(() => ({ leads: [] }))
        ]);
        const stats = statsRes.stats || [];
        const leads = leadsRes.leads || [];
        setMisSummary({
          totalLeads: leads.length,
          convertedLeads: leads.filter(l => l.status === 'converted').length,
          totalStudents: stats.reduce((a, b) => a + (b.total_students || 0), 0),
          totalCollected: stats.reduce((a, b) => a + (b.total_collected || 0), 0),
          totalPending: stats.reduce((a, b) => a + (b.total_pending || 0), 0)
        });
      } catch (e) {
        console.error(e);
      }
    }
    loadMisSummary();
  }, [apiFetch, selectedBranchId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeReport === 'fees') endpoint = '/api/reports/fees-collection';
      else if (activeReport === 'defaulters') endpoint = '/api/reports/pending-defaulters';
      else if (activeReport === 'expenses') endpoint = '/api/reports/expenses';

      let queryParams = `?timeframe=${timeframe}`;
      if (selectedBranchId) queryParams += `&branchId=${selectedBranchId}`;
      if (timeframe === 'custom' && fromDate) queryParams += `&fromDate=${fromDate}`;
      if (timeframe === 'custom' && toDate) queryParams += `&toDate=${toDate}`;

      const res = await apiFetch(`${endpoint}${queryParams}`);
      setReportData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, timeframe, fromDate, toDate, selectedBranchId]);

  // Single-Click PDF Download Trigger
  const handleDownloadPDF = () => {
    if (!reportData) return;

    const metadata = {
      schoolName: settings.app_name || 'Apex Pro Driving Academy',
      branchName: currentUser?.branch_name
    };

    if (activeReport === 'fees') {
      exportFeesCollectionPDF(reportData, metadata);
    } else if (activeReport === 'defaulters') {
      exportDefaultersPDF(reportData, metadata);
    } else if (activeReport === 'expenses') {
      exportExpensesPDF(reportData, metadata);
    }

    showToast(`Official ${reportData.report_type} PDF downloaded successfully!`);
  };

  const conversionRate = misSummary.totalLeads > 0
    ? Math.round((misSummary.convertedLeads / misSummary.totalLeads) * 100)
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <span>MIS Reports & Executive Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-branch metrics across lead conversion, admissions, and financial receivables.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={!reportData || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-sm shadow-purple-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Official PDF</span>
        </button>
      </div>

      {/* Executive Analytics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{conversionRate}%</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">
            Lead Conversion ({misSummary.convertedLeads}/{misSummary.totalLeads})
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{misSummary.totalStudents}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Total Admissions</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{misSummary.totalCollected.toLocaleString('en-IN')}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Realized Collections</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{misSummary.totalPending.toLocaleString('en-IN')}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Financial Receivables</div>
        </div>
      </div>

      {/* Standalone Report Engine Tabs */}
      <div className={`grid grid-cols-1 ${canAccessExpenses ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <button
          onClick={() => setActiveReport('fees')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeReport === 'fees' 
              ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-400' 
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold text-blue-700">
            <span>1. Fees Collection Report</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Itemized receipts, payment mode totals, and staff tracking</p>
        </button>

        <button
          onClick={() => setActiveReport('defaulters')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeReport === 'defaulters' 
              ? 'bg-rose-50/50 border-rose-500 ring-2 ring-rose-400' 
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold text-rose-700">
            <span>2. Pending Fees & Defaulters</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Remaining balances, Day 10 flags, and financial risk rankings</p>
        </button>

        {canAccessExpenses && (
          <button
            onClick={() => setActiveReport('expenses')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeReport === 'expenses' 
                ? 'bg-teal-50/50 border-teal-500 ring-2 ring-teal-400' 
                : 'bg-white border-slate-200 hover:border-teal-300'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-bold text-teal-700">
              <span>3. Operational Expenses Report</span>
              <Receipt className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Fuel, maintenance, repairs, tea and RTO office challans</p>
          </button>
        )}
      </div>

      {/* Flexible Time-Frame Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Time Frame:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-bold">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 rounded-md transition-all ${timeframe === 'weekly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Weekly (7 Days)
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 rounded-md transition-all ${timeframe === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Monthly (This Month)
            </button>
            <button
              onClick={() => setTimeframe('custom')}
              className={`px-3 py-1 rounded-md transition-all ${timeframe === 'custom' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Custom Date Range
            </button>
          </div>
        </div>

        {timeframe === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border rounded-lg"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              placeholder="To Date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Report Data Preview & Table */}
      {reportData && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          
          {/* Header Summary */}
          <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Preview</span>
              <h3 className="font-black text-slate-900 text-base">{reportData.report_type}</h3>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {activeReport === 'fees' && (
                <div>
                  <span className="text-slate-400">Total Collected: </span>
                  <strong className="text-emerald-700 font-mono text-sm font-bold">
                    ₹{(reportData.total_collection || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              )}
              {activeReport === 'defaulters' && (
                <div>
                  <span className="text-slate-400">Total Dues Pending: </span>
                  <strong className="text-rose-600 font-mono text-sm font-bold">
                    ₹{(reportData.total_pending_amount || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              )}
              {activeReport === 'expenses' && (
                <div>
                  <span className="text-slate-400">Total Operational Cost: </span>
                  <strong className="text-rose-600 font-mono text-sm font-bold">
                    ₹{(reportData.total_expenses || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              
              {/* Fees Collection Table */}
              {activeReport === 'fees' && (
                <>
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Enroll ID</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Staff Collector</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.records?.map(r => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{r.receipt_no}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{r.payment_date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{r.student_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.enroll_id}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.payment_mode}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">₹{r.amount}</td>
                        <td className="py-2.5 px-3 text-slate-500">{r.collected_by_name || 'Staff'}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* Defaulters Table */}
              {activeReport === 'defaulters' && (
                <>
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Enroll ID</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Training Days</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Risk Level</th>
                      <th className="py-2.5 px-3">Pending Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.records?.map(r => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{r.enroll_id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{r.student_name}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{r.student_phone}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Day {r.days_completed}/{r.total_course_days}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.is_day_10_warning ? 'Day 10 Flag' : `${r.remaining_days}d left`}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.risk_level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">₹{r.pending_balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* Expenses Table */}
              {activeReport === 'expenses' && (
                <>
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Vehicle Tag</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Receipt Ref</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.records?.map(r => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{r.category}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.vehicle_reg ? `${r.vehicle_model} (${r.vehicle_reg})` : 'General / Office'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.payment_mode}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{r.receipt_ref || '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-700">₹{r.amount}</td>
                        <td className="py-2.5 px-3 text-slate-500">{r.logged_by_name || 'Staff'}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

            </table>
          </div>

        </div>
      )}

    </div>
  );
}
