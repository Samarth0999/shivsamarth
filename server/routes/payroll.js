const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getAuthorizedBranchFilter, requireRole } = require('../middleware/auth');

/**
 * Returns all YYYY-MM-DD dates in the given year/month that fall on Sunday.
 */
function getSundayDatesInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const sundays = [];
  const monthPadded = String(month).padStart(2, '0');

  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month - 1, day).getDay() === 0) {
      sundays.push(`${year}-${monthPadded}-${String(day).padStart(2, '0')}`);
    }
  }
  return { daysInMonth, sundays };
}

/**
 * Computes payroll summary for a single staff member, including paid Sunday leaves
 * and any owner-applied Days Present override.
 */
function computeStaffPayrollRow(staff, currentMonth, daysInMonth, sundayDates) {
  const attRows = db.prepare(`
    SELECT date, status
    FROM staff_attendance
    WHERE user_id = ? AND date LIKE ?
  `).all(staff.id, `${currentMonth}%`);

  const attByDate = {};
  let attendedDays = 0;
  attRows.forEach(row => {
    const val = row.status === 'present' ? 1 : row.status === 'half_day' ? 0.5 : 0;
    attByDate[row.date] = val;
    attendedDays += val;
  });

  // Sunday is a paid leave day; avoid double-counting if staff already checked in on a Sunday
  let paidSundays = 0;
  sundayDates.forEach(sunDate => {
    const workedOnSun = attByDate[sunDate] || 0;
    paidSundays += Math.max(0, 1 - workedOnSun);
  });

  const autoDaysPresent = Math.min(daysInMonth, attendedDays + paidSundays);

  const existingRecord = db.prepare(`
    SELECT * FROM payroll_records WHERE user_id = ? AND month_year = ?
  `).get(staff.id, currentMonth);

  const isDaysOverridden = Boolean(
    existingRecord &&
    existingRecord.days_present_override !== null &&
    existingRecord.days_present_override !== undefined
  );

  const daysPresent = isDaysOverridden
    ? Number(existingRecord.days_present_override)
    : autoDaysPresent;

  const advanceSum = db.prepare(`
    SELECT SUM(amount) as total_advance
    FROM staff_advances
    WHERE user_id = ? AND date LIKE ?
  `).get(staff.id, `${currentMonth}%`);

  const advancesDeducted = advanceSum.total_advance || 0;

  let grossPay = 0;
  if (staff.salary_type === 'daily') {
    grossPay = Math.round(staff.base_salary * daysPresent);
  } else {
    grossPay = Math.round((staff.base_salary / daysInMonth) * daysPresent);
  }

  const incentives = existingRecord?.incentives || 0;
  const netPayable = Math.max(0, grossPay + incentives - advancesDeducted);

  return {
    user_id: staff.id,
    name: staff.name,
    role: staff.role,
    branch_name: staff.branch_name,
    branch_id: staff.branch_id,
    salary_type: staff.salary_type,
    base_salary: staff.base_salary,
    days_in_month: daysInMonth,
    sundays_in_month: sundayDates.length,
    attended_days: attendedDays,
    paid_sundays: paidSundays,
    auto_days_present: autoDaysPresent,
    days_present: daysPresent,
    is_days_overridden: isDaysOverridden,
    gross_pay: grossPay,
    incentives,
    advances_deducted: advancesDeducted,
    net_payable: netPayable,
    status: existingRecord ? existingRecord.status : 'unpaid',
    paid_date: existingRecord ? existingRecord.paid_date : null
  };
}

// Get payroll calculations for a specific month
router.get('/calculate', (req, res) => {
  const currentMonth = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const branchFilter = getAuthorizedBranchFilter(req);

  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const { daysInMonth, sundays } = getSundayDatesInMonth(year, month);

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
  const payrollSummary = staffMembers.map(staff =>
    computeStaffPayrollRow(staff, currentMonth, daysInMonth, sundays)
  );

  res.json({
    month: currentMonth,
    daysInMonth,
    sundaysInMonth: sundays.length,
    payroll: payrollSummary
  });
});

// Override Days Present for a staff member (Owner / Super Admin ONLY)
router.put('/days-present', requireRole(['super_admin']), (req, res) => {
  const { user_id, month_year, days_present } = req.body;

  if (!user_id || !month_year) {
    return res.status(400).json({ error: 'User ID and month (YYYY-MM) are required.' });
  }

  const staff = db.prepare(`
    SELECT u.*, b.name as branch_name
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ? AND u.is_active = 1
  `).get(user_id);

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const [yearStr, monthStr] = month_year.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const { daysInMonth, sundays } = getSundayDatesInMonth(year, month);

  const isReset = days_present === null || days_present === undefined || days_present === '';
  let overrideVal = null;

  if (!isReset) {
    const parsed = Number(days_present);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > daysInMonth) {
      return res.status(400).json({ error: `Days Present must be between 0 and ${daysInMonth}.` });
    }
    overrideVal = Math.round(parsed * 2) / 2; // normalize to 0.5 steps
  }

  try {
    // Upsert override value first (preserving current status if record exists)
    const existing = db.prepare('SELECT * FROM payroll_records WHERE user_id = ? AND month_year = ?').get(user_id, month_year);

    if (existing) {
      db.prepare('UPDATE payroll_records SET days_present_override = ? WHERE id = ?').run(overrideVal, existing.id);
    } else {
      db.prepare(`
        INSERT INTO payroll_records (
          user_id, month_year, salary_type, base_salary, days_in_month, days_present,
          days_present_override, gross_pay, advances_deducted, incentives, net_payable, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 'unpaid')
      `).run(user_id, month_year, staff.salary_type, staff.base_salary, daysInMonth, overrideVal ?? 0, overrideVal);
    }

    const updatedRow = computeStaffPayrollRow(staff, month_year, daysInMonth, sundays);

    db.prepare(`
      UPDATE payroll_records
      SET days_present = ?, gross_pay = ?, advances_deducted = ?, net_payable = ?
      WHERE user_id = ? AND month_year = ?
    `).run(updatedRow.days_present, updatedRow.gross_pay, updatedRow.advances_deducted, updatedRow.net_payable, user_id, month_year);

    res.json({
      success: true,
      message: isReset
        ? `Reset Days Present for ${staff.name} to auto-calculated (${updatedRow.days_present} days).`
        : `Updated Days Present for ${staff.name} to ${updatedRow.days_present} days.`,
      row: updatedRow
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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
        days_present = excluded.days_present,
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
