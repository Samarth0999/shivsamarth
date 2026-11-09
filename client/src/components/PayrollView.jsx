import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wallet, Plus, DollarSign, Calendar, Users, 
  CheckCircle, ArrowDownCircle, FileText, X
} from 'lucide-react';

export function PayrollView() {
  const { currentUser, selectedBranchId, branches, usersList, apiFetch, showToast, setActiveTab } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isBranchManager = currentUser?.role === 'branch_manager';
  const isManagerOrAdmin = isSuperAdmin || isBranchManager;

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [payrollData, setPayrollData] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    user_id: '',
    amount: '',
    payment_mode: 'UPI',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      let url = `/api/payroll/calculate?month=${month}`;
      if (selectedBranchId) url += `&branchId=${selectedBranchId}`;

      const res = await apiFetch(url);
      if (res.payroll) setPayrollData(res.payroll);
      if (res.daysInMonth) setDaysInMonth(res.daysInMonth);

      const advRes = await apiFetch(`/api/payroll/advances?month=${month}`);
      if (advRes.advances) setAdvances(advRes.advances);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, selectedBranchId]);

  // Record Staff Advance
  const handleRecordAdvance = async (e) => {
    e.preventDefault();
    if (!advanceForm.user_id || !advanceForm.amount || Number(advanceForm.amount) <= 0) {
      showToast('Please select a staff member and enter a valid advance amount.', 'error');
      return;
    }

    try {
      await apiFetch('/api/payroll/advances', {
        method: 'POST',
        body: JSON.stringify({
          ...advanceForm,
          amount: Number(advanceForm.amount)
        })
      });

      showToast('Salary advance logged successfully!');
      setIsAdvanceModalOpen(false);
      setAdvanceForm({
        user_id: '',
        amount: '',
        payment_mode: 'UPI',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchPayroll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Mark Staff Payout as Paid
  const handlePayout = async (row) => {
    try {
      await apiFetch('/api/payroll/payout', {
        method: 'POST',
        body: JSON.stringify({
          user_id: row.user_id,
          month_year: month,
          salary_type: row.salary_type,
          base_salary: row.base_salary,
          days_in_month: row.days_in_month,
          days_present: row.days_present,
          gross_pay: row.gross_pay,
          advances_deducted: row.advances_deducted,
          incentives: row.incentives,
          net_payable: row.net_payable
        })
      });

      showToast(`Payout confirmed for ${row.name}! Net Paid: ₹${row.net_payable}`);
      fetchPayroll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const totalNetPayroll = payrollData.reduce((sum, p) => sum + p.net_payable, 0);
  const totalAdvancesDeducted = payrollData.reduce((sum, p) => sum + p.advances_deducted, 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Automated Staff Payroll & Wage Engine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              Month: {month} ({daysInMonth} Days)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Module 8: Automated pro-rata salary and daily wage calculation with advance deductions: Gross = (Base Salary / Month Days * Days Present) - Advances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
          />
          {isManagerOrAdmin && (
            <>
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                title="Open Admin Settings to add or configure staff"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Staff Roster & Add Staff</span>
              </button>
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Issue Salary Advance</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase">
            {isManagerOrAdmin ? 'Total Net Payable This Month' : 'My Net Payable This Month'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{totalNetPayroll.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isManagerOrAdmin ? `Across ${payrollData.length} team members` : 'Personal compensation statement'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase">
            {isManagerOrAdmin ? 'Total Salary Advances Deducted' : 'My Salary Advances Deducted'}
          </span>
          <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
            ₹{totalAdvancesDeducted.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Directly deducted from gross payout</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase">Wage Configuration Support</span>
          <div className="text-base font-bold text-slate-800 mt-2">
            Monthly Salaries & Daily Wages
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Synced to GPS geofence verified attendance</div>
        </div>
      </div>

      {/* Payroll Calculation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-bold text-sm text-slate-900">
            {isManagerOrAdmin ? 'Monthly Compensation Ledger' : 'My Compensation & Wage Statement'}
          </h4>
          <span className="text-xs text-slate-400">Days in Period: {daysInMonth}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Role & Branch</th>
                <th className="py-3 px-3">Wage Type</th>
                <th className="py-3 px-3">Days Present</th>
                <th className="py-3 px-3">Gross Pay</th>
                <th className="py-3 px-3">Advances</th>
                <th className="py-3 px-3">Net Payable</th>
                <th className="py-3 px-3">Status</th>
                {isManagerOrAdmin && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollData.map(row => (
                <tr key={row.user_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                  
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-700 capitalize">{row.role.replace('_', ' ')}</div>
                    <div className="text-[11px] text-slate-400">{row.branch_name || 'All Branches'}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800 capitalize">{row.salary_type}</span>
                    <span className="ml-1 text-[11px] font-mono text-slate-500">(₹{row.base_salary})</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-black text-blue-700">{row.days_present}</span>
                    <span className="text-slate-400 text-[11px]"> / {daysInMonth}</span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    ₹{row.gross_pay.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-amber-600">
                    - ₹{row.advances_deducted.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 font-mono font-black text-emerald-700 text-sm">
                    ₹{row.net_payable.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      row.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>

                  {isManagerOrAdmin && (
                    <td className="py-3 px-4 text-right">
                      {row.status !== 'paid' ? (
                        <button
                          onClick={() => handlePayout(row)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Confirm Payout
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold">Paid on {row.paid_date}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Advances Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 mb-3">
          {isManagerOrAdmin ? 'Salary Advances Given This Month' : 'My Salary Advances This Month'}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Staff Name</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advances.map(a => (
                <tr key={a.id}>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{a.date}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{a.staff_name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{a.payment_mode}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-700">₹{a.amount}</td>
                  <td className="py-2.5 px-3 text-slate-500">{a.notes || 'Salary Advance'}</td>
                </tr>
              ))}
              {advances.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">No advances logged for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue Advance */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Issue Staff Salary Advance</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRecordAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Staff Member *</label>
                <select
                  value={advanceForm.user_id}
                  onChange={e => setAdvanceForm({ ...advanceForm, user_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  <option value="">Select staff...</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  min="100"
                  placeholder="e.g. 2000"
                  value={advanceForm.amount}
                  onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold font-mono text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={advanceForm.payment_mode}
                    onChange={e => setAdvanceForm({ ...advanceForm, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={advanceForm.date}
                    onChange={e => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Festival advance / Emergency"
                  value={advanceForm.notes}
                  onChange={e => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAdvanceModalOpen(false)} className="px-3 py-2 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl">Record Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
