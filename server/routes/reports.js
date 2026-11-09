const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getAuthorizedBranchFilter } = require('../middleware/auth');

// Helper to calculate date range filters
function getDateRange(timeframe, fromDate, toDate) {
  const now = new Date();
  let start = fromDate;
  let end = toDate || now.toISOString().split('T')[0];

  if (timeframe === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    start = d.toISOString().split('T')[0];
  } else if (timeframe === 'monthly') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    start = d.toISOString().split('T')[0];
  }

  return { start, end };
}

// 1. FEES COLLECTION REPORT ENGINE
router.get('/fees-collection', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);
  const { timeframe, fromDate, toDate, payment_mode } = req.query;
  const { start, end } = getDateRange(timeframe, fromDate, toDate);

  let query = `
    SELECT 
      sp.id,
      sp.receipt_no,
      sp.amount,
      sp.payment_mode,
      sp.payment_date,
      sp.notes,
      s.enroll_id,
      s.name as student_name,
      s.phone as student_phone,
      b.name as branch_name,
      b.code as branch_code,
      c.name as course_name,
      u.name as collected_by_name
    FROM student_payments sp
    JOIN students s ON sp.student_id = s.id
    JOIN branches b ON s.branch_id = b.id
    JOIN course_types c ON s.course_type_id = c.id
    LEFT JOIN users u ON sp.collected_by_user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND s.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  if (start) {
    query += ' AND sp.payment_date >= ?';
    params.push(start);
  }

  if (end) {
    query += ' AND sp.payment_date <= ?';
    params.push(end);
  }

  if (payment_mode) {
    query += ' AND sp.payment_mode = ?';
    params.push(payment_mode);
  }

  query += ' ORDER BY sp.payment_date DESC, sp.id DESC';

  const payments = db.prepare(query).all(...params);

  // Breakdown by payment mode
  const modeBreakdown = { Cash: 0, UPI: 0, Card: 0, 'Bank Transfer': 0 };
  let totalCollection = 0;

  payments.forEach(p => {
    modeBreakdown[p.payment_mode] = (modeBreakdown[p.payment_mode] || 0) + p.amount;
    totalCollection += p.amount;
  });

  res.json({
    report_type: 'Fees Collection Report',
    date_range: { start, end },
    total_transactions: payments.length,
    total_collection: totalCollection,
    mode_breakdown: modeBreakdown,
    records: payments
  });
});

// 2. PENDING FEES & DEFAULTERS REPORT ENGINE
router.get('/pending-defaulters', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);
  const { risk_level, only_day_10 } = req.query;

  // Read settings
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  const lowThreshold = parseInt(settings.risk_low_remaining_days || '15', 10);
  const highThreshold = parseInt(settings.risk_high_remaining_days || '5', 10);
  const day10Threshold = parseInt(settings.day_10_warning_threshold || '10', 10);

  let query = `
    SELECT 
      s.id,
      s.enroll_id,
      s.name as student_name,
      s.phone as student_phone,
      s.days_completed,
      s.total_course_days,
      s.net_total_fee,
      s.total_paid,
      s.pending_balance,
      s.expected_end_date,
      s.admission_date,
      s.last_whatsapp_reminder_at,
      b.name as branch_name,
      b.code as branch_code,
      c.name as course_name,
      u.name as instructor_name
    FROM students s
    JOIN branches b ON s.branch_id = b.id
    JOIN course_types c ON s.course_type_id = c.id
    LEFT JOIN users u ON s.primary_instructor_id = u.id
    WHERE s.pending_balance > 0 AND s.status = 'active'
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND s.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  query += ' ORDER BY s.pending_balance DESC';

  const rows = db.prepare(query).all(...params);

  let defaulters = rows.map(s => {
    const remainingDays = Math.max(0, s.total_course_days - s.days_completed);
    const isDay10Triggered = s.days_completed >= day10Threshold;

    let risk = 'LOW';
    if (remainingDays >= lowThreshold) {
      risk = 'LOW';
    } else if (remainingDays <= highThreshold) {
      risk = 'HIGH';
    } else {
      risk = 'MEDIUM';
    }

    return {
      ...s,
      remaining_days: remainingDays,
      is_day_10_warning: isDay10Triggered,
      risk_level: risk
    };
  });

  if (risk_level) {
    defaulters = defaulters.filter(d => d.risk_level === risk_level.toUpperCase());
  }

  if (only_day_10 === 'true') {
    defaulters = defaulters.filter(d => d.is_day_10_warning);
  }

  const totalPendingAmount = defaulters.reduce((acc, d) => acc + d.pending_balance, 0);
  const highRiskCount = defaulters.filter(d => d.risk_level === 'HIGH').length;
  const mediumRiskCount = defaulters.filter(d => d.risk_level === 'MEDIUM').length;
  const lowRiskCount = defaulters.filter(d => d.risk_level === 'LOW').length;

  res.json({
    report_type: 'Pending Fees & Defaulters Report',
    total_defaulters: defaulters.length,
    total_pending_amount: totalPendingAmount,
    risk_summary: {
      high_risk: highRiskCount,
      medium_risk: mediumRiskCount,
      low_risk: lowRiskCount
    },
    records: defaulters
  });
});

// 3. EXPENSES REPORT ENGINE
router.get('/expenses', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);
  const { timeframe, fromDate, toDate, category, vehicle_id } = req.query;
  const { start, end } = getDateRange(timeframe, fromDate, toDate);

  let query = `
    SELECT 
      e.id,
      e.category,
      e.amount,
      e.payment_mode,
      e.date,
      e.receipt_ref,
      e.notes,
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

  if (start) {
    query += ' AND e.date >= ?';
    params.push(start);
  }

  if (end) {
    query += ' AND e.date <= ?';
    params.push(end);
  }

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  if (vehicle_id) {
    query += ' AND e.vehicle_id = ?';
    params.push(vehicle_id);
  }

  query += ' ORDER BY e.date DESC, e.id DESC';

  const expenses = db.prepare(query).all(...params);

  const categoryBreakdown = {};
  let totalExpenses = 0;

  expenses.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    totalExpenses += e.amount;
  });

  res.json({
    report_type: 'Operational Expenses Report',
    date_range: { start, end },
    total_entries: expenses.length,
    total_expenses: totalExpenses,
    category_breakdown: categoryBreakdown,
    records: expenses
  });
});

module.exports = router;
