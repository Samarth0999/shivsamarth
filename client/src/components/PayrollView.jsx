import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet, Users, ArrowDownCircle, X, Edit2, Check, RotateCcw, CalendarCheck
} from 'lucide-react';

export function PayrollView() {
  const { currentUser, selectedBranchId, usersList, apiFetch, showToast, setActiveTab } = useApp();

  // Only Owner (super_admin) can manually edit Days Present
  const isOwner = currentUser?.role === 'super_admin';
  const isBranchManager = currentUser?.role === 'branch_manager';
  const isManagerOrAdmin = isOwner || isBranchManager;

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [payrollData, setPayrollData] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [sundaysInMonth, setSundaysInMonth] = useState(4);
  const [loading, setLoading] = useState(true);

  // Inline Owner Days Present Editor
  const [editingUserId, setEditingUserId] = useState(null);
  const [editDaysValue, setEditDaysValue] = useState('');
  const [savingDays, setSavingDays] = useState(false);

  // Advance Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    user_id: '',
    amount: '',
    payment_mode: 'UPI',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/payroll/calculate?month=${month}`;
      if (selectedBranchId) url += `&branchId=${selectedBranchId}`;

      const [res, advRes] = await Promise.all([
        apiFetch(url),
        apiFetch(`/api/payroll/advances?month=${month}`)
      ]);

      if (res.payroll) setPayrollData(res.payroll);
      if (res.daysInMonth) setDaysInMonth(res.daysInMonth);
      if (res.sundaysInMonth !== undefined) setSundaysInMonth(res.sundaysInMonth);
      if (advRes.advances) setAdvances(advRes.advances);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, month, selectedBranchId]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Owner-only: Save overridden Days Present
  const handleSaveDaysPresent = async (userId, overrideValue) => {
    setSavingDays(true);
    try {
      const res = await apiFetch('/api/payroll/days-present', {
        method: 'PUT',
        body: JSON.stringify({
          user_id: userId,
          month_year: month,
          days_present: overrideValue
        })
      });
      showToast(res.message || 'Days Present updated');
      setEditingUserId(null);
      setEditDaysValue('');
      fetchPayroll();
    } catch (err) {
      showToast(err.message || 'Failed to update Days Present', 'error');
    } finally {
      setSavingDays(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
            <Wallet className="w-6 h-6 text-purple-600" />
            <span>Staff Payroll & Wage Engine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              {month} • {daysInMonth} Days ({sundaysInMonth} Paid Sundays)
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Includes automatic paid leave on Sundays. {isOwner ? 'As Owner, you can directly adjust or reset Days Present.' : 'Days Present adjustment is restricted to the Owner.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-purple-500"
          />
          {isManagerOrAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className="h-10 flex items-center gap-1.5 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              >
                <Users className="w-4 h-4 text-purple-600" />
                <span>Staff Directory</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(true)}
                className="h-10 flex items-center gap-1.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-purple-600/20 transition-colors shrink-0 cursor-pointer"
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            {isManagerOrAdmin ? 'Total Net Payable This Month' : 'My Net Payable This Month'}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            ₹{totalNetPayroll.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isManagerOrAdmin ? `Across ${payrollData.length} team members` : 'Personal compensation statement'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            {isManagerOrAdmin ? 'Total Salary Advances Deducted' : 'My Salary Advances Deducted'}
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-2 font-mono">
            ₹{totalAdvancesDeducted.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Directly deducted from gross payout</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Paid Sunday Leave Policy</span>
          </span>
          <div className="text-base font-bold text-slate-900 mt-2">
            {sundaysInMonth} Paid Sundays Credited
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Auto-credited on Sundays • {isOwner ? 'Owner override enabled' : 'Owner-only override'}
          </div>
        </div>
      </div>

      {/* Payroll Calculation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-bold text-sm text-slate-900">
            {isManagerOrAdmin ? 'Monthly Compensation Ledger' : 'My Compensation & Wage Statement'}
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            {loading ? 'Refreshing...' : `Period: ${daysInMonth} days (${sundaysInMonth} Sundays)`}
          </span>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {payrollData.map(row => {
            const isEditingThis = editingUserId === row.user_id;

            return (
              <div key={row.user_id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{row.name}</div>
                    <div className="text-xs text-slate-500 capitalize">
                      {row.role.replace('_', ' ')} · {row.branch_name || 'All Branches'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                      {row.salary_type} (<span className="font-mono">₹{row.base_salary}</span>)
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    row.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {row.status}
                  </span>
                </div>

                {/* Days Present + Owner-Only Inline Editor */}
                <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Days Present</div>
                    {isOwner && isEditingThis ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          min="0"
                          max={daysInMonth}
                          step="0.5"
                          value={editDaysValue}
                          onChange={(e) => setEditDaysValue(e.target.value)}
                          className="w-20 h-8 px-2 rounded-lg border border-purple-400 bg-white text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-200"
                        />
                        <button
                          type="button"
                          disabled={savingDays}
                          onClick={() => handleSaveDaysPresent(row.user_id, editDaysValue)}
                          className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-50"
                          title="Save Days Present"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(null);
                            setEditDaysValue('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-0.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-purple-700">{row.days_present}</span>
                          <span className="text-slate-400">/ {daysInMonth}</span>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserId(row.user_id);
                                setEditDaysValue(String(row.days_present));
                              }}
                              className="p-1 rounded-md text-slate-500 hover:text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                              title="Edit Days Present (Owner Only)"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {isOwner && row.is_days_overridden && (
                            <button
                              type="button"
                              onClick={() => handleSaveDaysPresent(row.user_id, null)}
                              className="p-1 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                              title={`Reset to auto (${row.auto_days_present} days)`}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.is_days_overridden ? (
                            <span className="text-purple-600 font-semibold">
                              Owner adjusted (Auto: {row.auto_days_present})
                            </span>
                          ) : (
                            <span>Attended {row.attended_days} + {row.paid_sundays} Sun</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Net Payable</div>
                    <div className="font-mono font-extrabold text-sm text-emerald-700">
                      ₹{row.net_payable.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="text-slate-500 space-x-2">
                    <span>Gross: <strong className="font-mono text-slate-800">₹{row.gross_pay.toLocaleString('en-IN')}</strong></span>
                    <span className="text-amber-600">Adv: <strong className="font-mono">-₹{row.advances_deducted.toLocaleString('en-IN')}</strong></span>
                  </div>
                  {isManagerOrAdmin && (
                    row.status !== 'paid' ? (
                      <button
                        type="button"
                        onClick={() => handlePayout(row)}
                        className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        Confirm Payout
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold">Paid on {row.paid_date}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-3">Role & Branch</th>
                <th className="py-3.5 px-3">Wage Type</th>
                <th className="py-3.5 px-3">Days Present</th>
                <th className="py-3.5 px-3">Gross Pay</th>
                <th className="py-3.5 px-3">Advances</th>
                <th className="py-3.5 px-3">Net Payable</th>
                <th className="py-3.5 px-3">Status</th>
                {isManagerOrAdmin && <th className="py-3.5 px-5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollData.map(row => {
                const isEditingThis = editingUserId === row.user_id;

                return (
                  <tr key={row.user_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{row.name}</td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-700 capitalize">{row.role.replace('_', ' ')}</div>
                      <div className="text-[11px] text-slate-400">{row.branch_name || 'All Branches'}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 capitalize">{row.salary_type}</span>
                      <span className="ml-1 text-[11px] font-mono text-slate-500">(₹{row.base_salary})</span>
                    </td>

                    {/* Days Present (Owner-Only Editable + Paid Sunday Breakdown) */}
                    <td className="py-3.5 px-3">
                      {isOwner && isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            step="0.5"
                            value={editDaysValue}
                            onChange={(e) => setEditDaysValue(e.target.value)}
                            className="w-16 h-8 px-2 rounded-lg border border-purple-400 bg-white text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-200"
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={savingDays}
                            onClick={() => handleSaveDaysPresent(row.user_id, editDaysValue)}
                            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-50"
                            title="Save Days Present"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(null);
                              setEditDaysValue('');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-purple-700">{row.days_present}</span>
                            <span className="text-slate-400 text-[11px]">/ {daysInMonth}</span>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(row.user_id);
                                  setEditDaysValue(String(row.days_present));
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                                title="Edit Days Present (Owner Only)"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            {isOwner && row.is_days_overridden && (
                              <button
                                type="button"
                                onClick={() => handleSaveDaysPresent(row.user_id, null)}
                                className="p-1 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                title={`Reset to auto (${row.auto_days_present} days)`}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {row.is_days_overridden ? (
                              <span className="text-purple-600 font-semibold">
                                Owner adjusted (Auto: {row.auto_days_present})
                              </span>
                            ) : (
                              <span>
                                Attended {row.attended_days} + {row.paid_sundays} Sun
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                      ₹{row.gross_pay.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-semibold text-amber-600">
                      - ₹{row.advances_deducted.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 text-sm">
                      ₹{row.net_payable.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        row.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>

                    {isManagerOrAdmin && (
                      <td className="py-3.5 px-5 text-right">
                        {row.status !== 'paid' ? (
                          <button
                            type="button"
                            onClick={() => handlePayout(row)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Confirm Payout
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold">Paid on {row.paid_date}</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Advances Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <h4 className="font-bold text-sm text-slate-900 mb-3">
          {isManagerOrAdmin ? 'Salary Advances Given This Month' : 'My Salary Advances This Month'}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
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
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{a.staff_name}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Issue Staff Salary Advance</h3>
              <button type="button" onClick={() => setIsAdvanceModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleRecordAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Staff Member *</label>
                <select
                  value={advanceForm.user_id}
                  onChange={e => setAdvanceForm({ ...advanceForm, user_id: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500"
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
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-sm outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={advanceForm.payment_mode}
                    onChange={e => setAdvanceForm({ ...advanceForm, payment_mode: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500"
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
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500"
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
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Record Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
