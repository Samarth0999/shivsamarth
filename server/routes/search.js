const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getAuthorizedBranchFilter } = require('../middleware/auth');

router.get('/', (req, res) => {
  const queryTerm = (req.query.q || '').trim();
  if (!queryTerm || queryTerm.length < 2) {
    return res.json({ results: { students: [], vehicles: [], staff: [] } });
  }

  const branchFilter = getAuthorizedBranchFilter(req);
  const searchPattern = `%${queryTerm}%`;

  // Search Students
  let studentSql = `
    SELECT s.id, s.enroll_id, s.name, s.phone, s.status, s.pending_balance, s.days_completed, s.total_course_days, b.name as branch_name
    FROM students s
    JOIN branches b ON s.branch_id = b.id
    WHERE (s.name LIKE ? OR s.phone LIKE ? OR s.enroll_id LIKE ?)
  `;
  const studentParams = [searchPattern, searchPattern, searchPattern];

  if (!branchFilter.isAll) {
    studentSql += ' AND s.branch_id = ?';
    studentParams.push(branchFilter.branchId);
  }

  studentSql += ' LIMIT 8';
  const students = db.prepare(studentSql).all(...studentParams);

  // Search Vehicles
  let vehicleSql = `
    SELECT v.id, v.reg_number, v.model, v.status, b.name as branch_name
    FROM vehicles v
    JOIN branches b ON v.branch_id = b.id
    WHERE (v.reg_number LIKE ? OR v.model LIKE ?)
  `;
  const vehicleParams = [searchPattern, searchPattern];

  if (!branchFilter.isAll) {
    vehicleSql += ' AND v.branch_id = ?';
    vehicleParams.push(branchFilter.branchId);
  }

  vehicleSql += ' LIMIT 5';
  const vehicles = db.prepare(vehicleSql).all(...vehicleParams);

  // Search Staff (if manager or super admin)
  let staff = [];
  if (req.user.role === 'super_admin' || req.user.role === 'branch_manager') {
    let staffSql = `
      SELECT u.id, u.name, u.role, u.phone, b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)
    `;
    const staffParams = [searchPattern, searchPattern, searchPattern];

    if (!branchFilter.isAll) {
      staffSql += ' AND u.branch_id = ?';
      staffParams.push(branchFilter.branchId);
    }

    staffSql += ' LIMIT 5';
    staff = db.prepare(staffSql).all(...staffParams);
  }

  res.json({
    results: {
      students,
      vehicles,
      staff
    }
  });
});

module.exports = router;
