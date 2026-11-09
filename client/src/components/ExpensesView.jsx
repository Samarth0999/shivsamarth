import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Receipt, Plus, Fuel, Wrench, Coffee, FileText, 
  Trash2, Filter, DollarSign, Car, Calendar, X,
  Edit, CheckCircle, Shield
} from 'lucide-react';
import { exportExpensesPDF } from '../utils/pdfGenerator';

export function ExpensesView() {
  const { 
    currentUser, 
    isSuperAdmin,
    hasPermission,
    selectedBranchId, 
    branches, 
    expenseCategories, 
    apiFetch, 
    showToast,
    settings 
  } = useApp();

  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [plSummary, setPlSummary] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit Expense Form State
  const [editingExpense, setEditingExpense] = useState(null);

  // Form
  const [expenseForm, setExpenseForm] = useState({
    category: 'Fuel',
    amount: '',
    payment_mode: 'Cash',
    vehicle_id: '',
    branch_id: '',
    date: new Date().toISOString().split('T')[0],
    receipt_ref: '',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?1=1`;
      if (selectedBranchId) url += `&branchId=${selectedBranchId}`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedVehicleId) url += `&vehicle_id=${selectedVehicleId}`;

      const res = await apiFetch(url);
      if (res.expenses) setExpenses(res.expenses);

      const vRes = await apiFetch(`/api/batches/vehicles${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`);
      if (vRes.vehicles) setVehicles(vRes.vehicles);

      const plRes = await apiFetch(`/api/expenses/pl-summary${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`);
      if (plRes.summary) setPlSummary(plRes.summary);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId, selectedCategory, selectedVehicleId]);

  // Submit Expense
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      showToast('Please enter a valid expense amount.', 'error');
      return;
    }

    try {
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          amount: Number(expenseForm.amount),
          branch_id: expenseForm.branch_id || selectedBranchId || branches[0]?.id
        })
      });

      showToast(`Expense of ₹${expenseForm.amount} for ${expenseForm.category} recorded!`);
      setIsAddExpenseOpen(false);
      setExpenseForm({
        category: 'Fuel',
        amount: '',
        payment_mode: 'Cash',
        vehicle_id: '',
        branch_id: '',
        date: new Date().toISOString().split('T')[0],
        receipt_ref: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Edit Expense Modal
  const handleOpenEditExpense = (expense) => {
    setEditingExpense({
      id: expense.id,
      category: expense.category,
      amount: expense.amount,
      payment_mode: expense.payment_mode || 'Cash',
      vehicle_id: expense.vehicle_id || '',
      branch_id: expense.branch_id,
      date: expense.date,
      receipt_ref: expense.receipt_ref || '',
      notes: expense.notes || ''
    });
    setIsEditExpenseOpen(true);
  };

  // Submit Edit Expense
  const handleSubmitEditExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense.amount || Number(editingExpense.amount) <= 0) {
      showToast('Please enter a valid expense amount.', 'error');
      return;
    }
    try {
      await apiFetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editingExpense,
          amount: Number(editingExpense.amount)
        })
      });
      showToast('Expense entry updated successfully!');
      setIsEditExpenseOpen(false);
      setEditingExpense(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Expense (Super Admin master delete or with edit_expenses permission)
  const handleDeleteExpense = async (expense) => {
    const isMaster = isSuperAdmin ? ' [MASTER DELETE: Super Admin]' : '';
    if (!window.confirm(`Are you sure you want to delete this expense record (${expense.category} - ₹${expense.amount})?${isMaster}`)) return;
    try {
      await apiFetch(`/api/expenses/${expense.id}`, { method: 'DELETE' });
      showToast('Expense entry deleted.');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const reportData = {
      total_entries: expenses.length,
      total_expenses: totalExp,
      records: expenses
    };

    exportExpensesPDF(reportData, {
      schoolName: settings.app_name,
      branchName: currentUser?.branch_name
    });
    showToast('Expenses Report PDF downloaded!');
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const canAccessExpenses = isSuperAdmin || hasPermission('view_expenses') || hasPermission('edit_expenses');

  if (!canAccessExpenses) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <Shield className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Access Restricted: Operational Expenses</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have authorized access to view or manage operational expenses. Please contact your Super Administrator to grant you the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono font-bold">view_expenses</code> privilege in the RBAC matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Daily Operational Expense Tracker</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
              ₹{totalExpenseAmount.toLocaleString('en-IN')} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Module 9: Quick logging for Fuel, Maintenance, Refreshments, and RTO office fees with Vehicle & Branch P&L tagging.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Export Expenses PDF</span>
          </button>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Daily Expense</span>
          </button>
        </div>
      </div>

      {/* Branch & Vehicle P&L Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plSummary.map(b => (
          <div key={b.branch_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">{b.branch_name}</h4>
              <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                {b.branch_code}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Fees Revenue:</span>
                <strong className="text-emerald-700 font-mono">₹{b.total_revenue.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expenses Logged:</span>
                <strong className="text-rose-600 font-mono">₹{b.total_expenses.toLocaleString('en-IN')}</strong>
              </div>
              {isSuperAdmin && (
                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold">
                  <span className="text-slate-800">Net Operating Margin:</span>
                  <span className={`font-mono ${b.net_margin >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    ₹{(b.net_margin || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Vehicle Cost Breakdown in Branch */}
            {b.vehicles?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fleet Costs</span>
                <div className="mt-1 space-y-1">
                  {b.vehicles.map(v => (
                    <div key={v.id} className="text-[11px] text-slate-600 flex justify-between">
                      <span className="truncate">{v.model} ({v.reg_number})</span>
                      <span className="font-mono font-bold text-slate-800">₹{v.total_vehicle_cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
        >
          <option value="">All Categories</option>
          {expenseCategories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        <select
          value={selectedVehicleId}
          onChange={e => setSelectedVehicleId(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
        >
          <option value="">All Vehicles & Office</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.model} ({v.reg_number})</option>
          ))}
        </select>
      </div>

      {/* Expense Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Vehicle / Tag</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Payment Mode</th>
              <th className="py-3 px-3">Logged By</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono text-slate-800 font-bold">{e.date}</td>
                <td className="py-3 px-3">
                  <span className="font-bold text-slate-900">{e.category}</span>
                  {e.receipt_ref && <span className="ml-1 text-[10px] text-slate-400 font-mono">({e.receipt_ref})</span>}
                </td>
                <td className="py-3 px-3">
                  {e.vehicle_reg ? (
                    <div>
                      <span className="font-semibold text-blue-700">{e.vehicle_model}</span>
                      <span className="ml-1 font-mono text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">{e.vehicle_reg}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Office / General ({e.branch_name})</span>
                  )}
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                  ₹{e.amount.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-slate-600">{e.payment_mode}</td>
                <td className="py-3 px-3 text-slate-500">{e.logged_by_name || 'Staff'}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {(isSuperAdmin || hasPermission('edit_expenses')) && (
                      <button
                        onClick={() => handleOpenEditExpense(e)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                        title={isSuperAdmin ? "Master Edit Expense (Super Admin)" : "Edit Expense"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {(isSuperAdmin || hasPermission('edit_expenses')) && (
                      <button
                        onClick={() => handleDeleteExpense(e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title={isSuperAdmin ? "Master Delete Expense (Super Admin)" : "Delete Expense"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">No expense entries found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Log Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Log Daily Operational Cost</h3>
              <button onClick={() => setIsAddExpenseOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 2500"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Tag (Optional for Office Expenses)</label>
                <select
                  value={expenseForm.vehicle_id}
                  onChange={e => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                >
                  <option value="">General / Office (No Vehicle Tag)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} ({v.reg_number})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={expenseForm.payment_mode}
                    onChange={e => setExpenseForm({ ...expenseForm, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bill / Receipt Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. IOCL-88912"
                  value={expenseForm.receipt_ref}
                  onChange={e => setExpenseForm({ ...expenseForm, receipt_ref: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddExpenseOpen(false)} className="px-3 py-2 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Expense */}
      {isEditExpenseOpen && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-amber-600" />
                  <span>Edit Expense Entry</span>
                </h3>
                {isSuperAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-amber-200">
                    Super Admin Master Authority
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => { setIsEditExpenseOpen(false); setEditingExpense(null); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditExpense} className="space-y-3.5 text-xs">
              {isSuperAdmin && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Location</label>
                  <select
                    value={editingExpense.branch_id}
                    onChange={e => setEditingExpense({ ...editingExpense, branch_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={editingExpense.category}
                  onChange={e => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  required
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingExpense.amount}
                  onChange={e => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Attribution (Optional)</label>
                <select
                  value={editingExpense.vehicle_id || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, vehicle_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">-- General Office / Non-Vehicle Expense --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} ({v.reg_number})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={editingExpense.payment_mode}
                    onChange={e => setEditingExpense({ ...editingExpense, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bill / Receipt Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. IOCL-88912"
                  value={editingExpense.receipt_ref}
                  onChange={e => setEditingExpense({ ...editingExpense, receipt_ref: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Additional context"
                  value={editingExpense.notes || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setIsEditExpenseOpen(false); setEditingExpense(null); }} 
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
