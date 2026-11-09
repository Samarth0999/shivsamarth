const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getAuthorizedBranchFilter, requireRole } = require('../middleware/auth');

// Get payroll calculations for a specific month
router.get('/calculate', (req, res) => {
  const currentMonth = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const branchFilter = getAuthorizedBranchFilter(req);

  // Determine total days in this month
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  let userQuery = `
    SELECT u.*, b.name as branch_name, b.code as branch_code
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.is_active = 1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    userQuery += ' AND u.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  // Access Control: Only Super Admin and Branch Manager can see payroll of other staff
  const isManagerOrAdmin = req.user.role === 'super_admin' || req.user.role === 'branch_manager';
  if (!isManagerOrAdmin) {
    userQuery += ' AND u.id = ?';
    params.push(req.user.id);
  }

  const staffMembers = db.prepare(userQuery).all(...params);

  const payrollSummary = staffMembers.map(staff => {
    // 1. Calculate days present in the month
    const attCount = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as full_days,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_days
      FROM staff_attendance
      WHERE user_id = ? AND date LIKE ?
    `).get(staff.id, `${currentMonth}%`);

    const daysPresent = (attCount.full_days || 0) + ((attCount.half_days || 0) * 0.5);

    // 2. Calculate advances given during this month
    const advanceSum = db.prepare(`
      SELECT SUM(amount) as total_advance
      FROM staff_advances
      WHERE user_id = ? AND date LIKE ?
    `).get(staff.id, `${currentMonth}%`);

    const advancesDeducted = advanceSum.total_advance || 0;

    // 3. Compute Gross Pay
    // Monthly salary: (Base Salary / Days in Month) * Days Present
    // Daily wage: Daily Wage * Days Present
    let grossPay = 0;
    if (staff.salary_type === 'daily') {
      grossPay = Math.round(staff.base_salary * daysPresent);
    } else {
      grossPay = Math.round((staff.base_salary / daysInMonth) * daysPresent);
    }

    const incentives = 0; // optional incentive
    const netPayable = Math.max(0, grossPay + incentives - advancesDeducted);

    // Check if finalized payroll record exists
    const existingRecord = db.prepare(`
      SELECT * FROM payroll_records WHERE user_id = ? AND month_year = ?
    `).get(staff.id, currentMonth);

    return {
      user_id: staff.id,
      name: staff.name,
      role: staff.role,
      branch_name: staff.branch_name,
      branch_id: staff.branch_id,
      salary_type: staff.salary_type,
      base_salary: staff.base_salary,
      days_in_month: daysInMonth,
      days_present: daysPresent,
      gross_pay: grossPay,
      incentives,
      advances_deducted: advancesDeducted,
      net_payable: netPayable,
      status: existingRecord ? existingRecord.status : 'unpaid',
      paid_date: existingRecord ? existingRecord.paid_date : null
    };
  });

  res.json({
    month: currentMonth,
    daysInMonth,
    payroll: payrollSummary
  });
});

// Record a salary advance for staff (Super Admin and Branch Manager only)
router.post('/advances', (req, res) => {
  const { user_id, amount, payment_mode, date, notes } = req.body;

  if (req.user.role !== 'super_admin' && req.user.role !== 'branch_manager') {
    return res.status(403).json({ error: 'Access denied: Only Super Admin and Branch Manager can issue salary advances.' });
  }

  if (!user_id || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid staff member and advance amount are required.' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const insert = db.prepare(`
      INSERT INTO staff_advances (user_id, amount, payment_mode, date, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(user_id, Number(amount), payment_mode || 'Cash', targetDate, notes || null);
    const created = db.prepare('SELECT * FROM staff_advances WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ advance: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List salary advances
router.get('/advances', (req, res) => {
  const { user_id, month } = req.query;
  const branchFilter = getAuthorizedBranchFilter(req);

  let query = `
    SELECT sa.*, u.name as staff_name, u.role as staff_role, b.name as branch_name
    FROM staff_advances sa
    JOIN users u ON sa.user_id = u.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND u.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  // Access Control: Only Super Admin and Branch Manager can see advances of other staff
  const isManagerOrAdmin = req.user.role === 'super_admin' || req.user.role === 'branch_manager';
  if (!isManagerOrAdmin) {
    query += ' AND sa.user_id = ?';
    params.push(req.user.id);
  } else if (user_id) {
    query += ' AND sa.user_id = ?';
    params.push(user_id);
  }

  if (month) {
    query += ' AND sa.date LIKE ?';
    params.push(`${month}%`);
  }

  query += ' ORDER BY sa.date DESC';
  const advances = db.prepare(query).all(...params);
  res.json({ advances });
});

// Mark payroll payout as paid (Super Admin and Branch Manager only)
router.post('/payout', (req, res) => {
  const { user_id, month_year, salary_type, base_salary, days_in_month, days_present, gross_pay, advances_deducted, incentives, net_payable } = req.body;

  if (req.user.role !== 'super_admin' && req.user.role !== 'branch_manager') {
    return res.status(403).json({ error: 'Access denied: Only Super Admin and Branch Manager can authorize payroll payouts.' });
  }

  if (!user_id || !month_year) {
    return res.status(400).json({ error: 'User ID and Month are required.' });
  }

  const paidDate = new Date().toISOString().split('T')[0];

  try {
    const upsert = db.prepare(`
      INSERT INTO payroll_records (
        user_id, month_year, salary_type, base_salary, days_in_month, days_present,
        gross_pay, advances_deducted, incentives, net_payable, status, paid_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)
      ON CONFLICT(user_id, month_year) DO UPDATE SET
        gross_pay = excluded.gross_pay,
        advances_deducted = excluded.advances_deducted,
        net_payable = excluded.net_payable,
        status = 'paid',
        paid_date = excluded.paid_date
    `);

    upsert.run(
      user_id,
      month_year,
      salary_type || 'monthly',
      base_salary || 0,
      days_in_month || 30,
      days_present || 0,
      gross_pay || 0,
      advances_deducted || 0,
      incentives || 0,
      net_payable || 0,
      paidDate
    );

    const record = db.prepare('SELECT * FROM payroll_records WHERE user_id = ? AND month_year = ?').get(user_id, month_year);
    res.json({ success: true, record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
