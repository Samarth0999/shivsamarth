import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  Receipt, Plus, Search, Download, IndianRupee,
  Wallet, CreditCard, Banknote, X
} from 'lucide-react';
import { exportStudentReceiptPDF, exportFeesCollectionPDF } from '../utils/pdfGenerator';

export function FeePaymentsView() {
  const { selectedBranchId, paymentModes, apiFetch, showToast, settings, currentUser } = useApp();

  const [records, setRecords] = useState([]);
  const [modeBreakdown, setModeBreakdown] = useState({});
  const [totalCollection, setTotalCollection] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  // Record Fee Installment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ timeframe: 'all' });
      if (selectedBranchId) params.set('branchId', selectedBranchId);
      if (modeFilter) params.set('payment_mode', modeFilter);

      const [ledgerRes, studentsRes] = await Promise.all([
        apiFetch(`/api/reports/fees-collection?${params.toString()}`),
        apiFetch(`/api/students${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`)
      ]);

      setRecords(ledgerRes.records || []);
      setModeBreakdown(ledgerRes.mode_breakdown || {});
      setTotalCollection(ledgerRes.total_collection || 0);
      setStudents(studentsRes.students || []);
    } catch (err) {
      showToast(err.message || 'Failed to load fee ledger', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, selectedBranchId, modeFilter, showToast]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const studentsWithDue = students.filter(s => (s.pending_balance || 0) > 0);
  const activeStudent = students.find(s => String(s.id) === String(selectedStudentId));

  const filteredRecords = records.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.receipt_no || '').toLowerCase().includes(q) ||
      (r.student_name || '').toLowerCase().includes(q) ||
      (r.enroll_id || '').toLowerCase().includes(q) ||
      (r.student_phone || '').toLowerCase().includes(q)
    );
  });

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !amount || Number(amount) <= 0) {
      showToast('Please select a student and enter a valid amount.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/api/students/${selectedStudentId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          payment_mode: paymentMode,
          notes
        })
      });
      showToast('Fee installment recorded & official receipt generated!');
      setIsModalOpen(false);
      setSelectedStudentId('');
      setAmount('');
      setNotes('');
      loadLedger();
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = (row) => {
    const matchedStudent = students.find(s => s.enroll_id === row.enroll_id) || {
      enroll_id: row.enroll_id,
      name: row.student_name,
      phone: row.student_phone,
      branch_name: row.branch_name,
      course_name: row.course_name,
      base_fee: row.amount,
      discount_given: 0,
      net_total_fee: row.amount,
      pending_balance: 0
    };

    exportStudentReceiptPDF(matchedStudent, row, {
      schoolName: settings.app_name || 'ShivSamarth Motor Driving School'
    });
    showToast(`Receipt ${row.receipt_no} PDF downloaded`);
  };

  const handleExportLedgerPDF = () => {
    exportFeesCollectionPDF(
      {
        date_range: { start: 'All Time', end: new Date().toISOString().split('T')[0] },
        total_collection: totalCollection,
        mode_breakdown: modeBreakdown,
        records: filteredRecords
      },
      {
        schoolName: settings.app_name || 'ShivSamarth Motor Driving School',
        branchName: currentUser?.branch_name || 'All Branches'
      }
    );
    showToast('Fees ledger PDF downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-purple-600" />
            <span>Fee Transactions & Official Receipts</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable financial ledger of fee collections, installments, receipts, and refund records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportLedgerPDF}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Fee Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{totalCollection.toLocaleString('en-IN')}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Total Fee Collections</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Banknote className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{(modeBreakdown.Cash || 0).toLocaleString('en-IN')}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Cash Collections</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{((modeBreakdown.UPI || 0) + (modeBreakdown.Card || 0) + (modeBreakdown['Bank Transfer'] || 0)).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">UPI / Card / Bank</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{records.length}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Official Receipts Issued</div>
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
            placeholder="Search by receipt no, student name, or enroll ID..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500"
          >
            <option value="">All Payment Modes</option>
            {(paymentModes || []).map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-medium px-2">
            Showing {filteredRecords.length} receipt(s)
          </span>
        </div>
      </div>

      {/* Receipts Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading fee ledger...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No fee transactions found matching your filters.
          </div>
        ) : (
          <>
          <div className="md:hidden divide-y divide-slate-100">
            {filteredRecords.map(row => (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {row.receipt_no}
                      </span>
                      <span className="text-[11px] text-slate-400">{row.payment_date}</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-1 truncate">{row.student_name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {row.enroll_id} · {row.course_name} · {row.branch_name || 'Main Branch'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-emerald-700">
                      ₹{(row.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {row.payment_mode}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400 truncate">
                    Collected by {row.collected_by_name || 'Staff'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(row)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Receipt No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Branch & Course</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Collected By</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-semibold text-purple-700">
                      {row.receipt_no}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {row.payment_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{row.student_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{row.enroll_id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{row.branch_name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{row.course_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {row.payment_mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {row.collected_by_name || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                      ₹{Number(row.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
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

      {/* Record Fee Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Record Fee Installment</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Student (with Pending Balance)
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedStudentId(id);
                    const found = students.find(s => String(s.id) === id);
                    if (found) setAmount(String(found.pending_balance));
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose Student --</option>
                  {studentsWithDue.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enroll_id}) — Due ₹{s.pending_balance}
                    </option>
                  ))}
                </select>
                {activeStudent && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Net Fee: ₹{activeStudent.net_total_fee} • Paid: ₹{activeStudent.total_paid} • Due: ₹{activeStudent.pending_balance}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={activeStudent?.pending_balance || undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                  >
                    {(paymentModes || []).map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Installment / UPI ref / remark"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
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
                  {submitting ? 'Saving...' : 'Save & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

