const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getAuthorizedBranchFilter } = require('../middleware/auth');

// Get expenses with filters
router.get('/', (req, res) => {
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.view_expenses && !req.user.parsedPermissions?.edit_expenses) {
    return res.status(403).json({ error: 'Access denied: You do not have permission to view operational expenses.' });
  }

  const branchFilter = getAuthorizedBranchFilter(req);
  const { category, vehicle_id, startDate, endDate } = req.query;

  let query = `
    SELECT 
      e.*,
      b.name as branch_name,
      b.code as branch_code,
      v.model as vehicle_model,
      v.reg_number as vehicle_reg,
      u.name as logged_by_name
    FROM expenses e
    JOIN branches b ON e.branch_id = b.id
    LEFT JOIN vehicles v ON e.vehicle_id = v.id
    LEFT JOIN users u ON e.logged_by_user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND e.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  if (vehicle_id) {
    query += ' AND e.vehicle_id = ?';
    params.push(vehicle_id);
  }

  if (startDate) {
    query += ' AND e.date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND e.date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY e.date DESC, e.id DESC';

  const expenses = db.prepare(query).all(...params);

  // Category-wise totals
  const categoryTotals = {};
  let grandTotal = 0;
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    grandTotal += e.amount;
  });

  res.json({ expenses, categoryTotals, grandTotal });
});

// Log new operational expense
router.post('/', (req, res) => {
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.edit_expenses) {
    return res.status(403).json({ error: 'Permission denied: edit_expenses right required to log expenses.' });
  }

  const { branch_id, vehicle_id, category, amount, payment_mode, date, receipt_ref, notes } = req.body;

  let targetBranchId = branch_id;
  if (req.user.role !== 'super_admin') {
    targetBranchId = req.user.branch_id;
  }

  if (!category || !amount || Number(amount) <= 0 || !targetBranchId) {
    return res.status(400).json({ error: 'Category, Amount, and Branch are required.' });
  }

  const expDate = date || new Date().toISOString().split('T')[0];

  try {
    const insert = db.prepare(`
      INSERT INTO expenses (branch_id, vehicle_id, category, amount, payment_mode, date, logged_by_user_id, receipt_ref, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      targetBranchId,
      vehicle_id || null,
      category,
      Number(amount),
      payment_mode || 'Cash',
      expDate,
      req.user.id,
      receipt_ref || null,
      notes || null
    );

    const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ expense: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update expense record (Super admin master edit or with edit_expenses permission)
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Expense not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.edit_expenses) {
    return res.status(403).json({ error: 'You do not have permission to edit expense records.' });
  }

  const { branch_id, vehicle_id, category, amount, payment_mode, date, receipt_ref, notes } = req.body;
  const targetBranchId = req.user.role === 'super_admin' && branch_id ? branch_id : existing.branch_id;

  try {
    const update = db.prepare(`
      UPDATE expenses
      SET branch_id = ?,
          vehicle_id = ?,
          category = COALESCE(?, category),
          amount = COALESCE(?, amount),
          payment_mode = COALESCE(?, payment_mode),
          date = COALESCE(?, date),
          receipt_ref = COALESCE(?, receipt_ref),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `);

    update.run(
      targetBranchId,
      vehicle_id !== undefined ? vehicle_id : existing.vehicle_id,
      category,
      amount !== undefined ? Number(amount) : existing.amount,
      payment_mode,
      date,
      receipt_ref,
      notes,
      id
    );

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.json({ success: true, expense: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete expense (Super admin or with edit_expenses permission)
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Expense not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_expenses && !req.user.parsedPermissions?.edit_expenses) {
    return res.status(403).json({ error: 'You do not have permission to delete expense records.' });
  }

  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Branch & Vehicle Level P&L Summary
router.get('/pl-summary', (req, res) => {
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.view_expenses && !req.user.parsedPermissions?.edit_expenses) {
    return res.status(403).json({ error: 'Access denied: You do not have permission to view operational expenses summary.' });
  }

  const isSuperAdmin = req.user.role === 'super_admin';
  const branchFilter = getAuthorizedBranchFilter(req);

  let branchQuery = 'SELECT id, name, code FROM branches';
  const params = [];

  if (!branchFilter.isAll) {
    branchQuery += ' WHERE id = ?';
    params.push(branchFilter.branchId);
  }

  const branches = db.prepare(branchQuery).all(...params);

  const summary = branches.map(b => {
    // Total fees collected
    const rev = db.prepare(`
      SELECT SUM(amount) as total_revenue
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      WHERE s.branch_id = ?
    `).get(b.id);

    // Total expenses
    const exp = db.prepare(`
      SELECT SUM(amount) as total_expenses FROM expenses WHERE branch_id = ?
    `).get(b.id);

    const revenue = rev.total_revenue || 0;
    const expenses = exp.total_expenses || 0;
    const netMargin = revenue - expenses;

    // Vehicle breakdown for this branch
    const vehicles = db.prepare(`
      SELECT 
        v.id, v.reg_number, v.model,
        COALESCE(SUM(CASE WHEN e.category = 'Fuel' THEN e.amount ELSE 0 END), 0) as fuel_cost,
        COALESCE(SUM(CASE WHEN e.category IN ('Vehicle Maintenance', 'Repairs') THEN e.amount ELSE 0 END), 0) as maintenance_cost,
        COALESCE(SUM(e.amount), 0) as total_vehicle_cost
      FROM vehicles v
      LEFT JOIN expenses e ON e.vehicle_id = v.id
      WHERE v.branch_id = ?
      GROUP BY v.id
    `).all(b.id);

    return {
      branch_id: b.id,
      branch_name: b.name,
      branch_code: b.code,
      total_revenue: revenue,
      total_expenses: expenses,
      ...(isSuperAdmin ? { net_margin: netMargin } : {}),
      vehicles
    };
  });

  res.json({ summary });
});

module.exports = router;
