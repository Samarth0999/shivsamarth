const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { calculateDistanceMeters } = require('../utils/haversine');
const { getAuthorizedBranchFilter } = require('../middleware/auth');

// ==========================================
// 1. STUDENT ATTENDANCE (STRATEGY A ENGINE)
// ==========================================

// Get batch roster for student attendance
router.get('/students/roster', (req, res) => {
  const { batch_id, date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const branchFilter = getAuthorizedBranchFilter(req);

  let query = `
    SELECT 
      s.id, s.enroll_id, s.name, s.phone, s.days_completed, s.total_course_days, 
      s.expected_end_date, s.admission_date, s.pending_balance, s.status as student_status,
      s.primary_instructor_id, s.batch_id, s.last_review_request_at,
      ct.name as course_name,
      b.name as branch_name,
      bt.name as batch_name, bt.time_slot,
      sa.id as attendance_id,
      sa.status as attendance_status,
      sa.notes as attendance_notes
    FROM students s
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN course_types ct ON s.course_type_id = ct.id
    LEFT JOIN batches bt ON s.batch_id = bt.id
    LEFT JOIN student_attendance sa ON sa.student_id = s.id AND sa.date = ?
    WHERE s.status = 'active'
  `;
  const params = [targetDate];

  if (!branchFilter.isAll) {
    query += ' AND s.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  // If user is instructor, prioritize their assigned batch or students
  if (req.user.role === 'instructor' && !batch_id) {
    // Show instructor's students or all active students in instructor's branch
  }

  if (batch_id) {
    query += ' AND s.batch_id = ?';
    params.push(batch_id);
  }

  query += ' ORDER BY s.name ASC';

  const roster = db.prepare(query).all(...params);
  res.json({ date: targetDate, roster });
});

// Mark student attendance with Strategy A Absence Rule
router.post('/students/mark', (req, res) => {
  const { student_id, date, status, notes } = req.body; // status: 'present' | 'absent'

  if (!student_id || !status) {
    return res.status(400).json({ error: 'Student ID and attendance status (present/absent) are required.' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Check branch permission
  if (req.user.role !== 'super_admin' && student.branch_id !== req.user.branch_id) {
    return res.status(403).json({ error: 'Access denied: student belongs to another branch.' });
  }

  // Check existing attendance for this date
  const existingAtt = db.prepare('SELECT * FROM student_attendance WHERE student_id = ? AND date = ?').get(student_id, targetDate);

  const markTx = db.transaction(() => {
    let daysDiff = 0;
    let daysToExtendGraduation = 0;

    if (!existingAtt) {
      // First time marking for this date
      if (status === 'present') {
        daysDiff = +1; // increments days_completed by 1
        daysToExtendGraduation = 0;
      } else if (status === 'absent') {
        // Strategy A Rule: leaves days_completed unchanged, extends graduation date by +1 day!
        daysDiff = 0;
        daysToExtendGraduation = +1;
      }

      db.prepare(`
        INSERT INTO student_attendance (student_id, batch_id, instructor_id, date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(student_id, student.batch_id, req.user.id, targetDate, status, notes || null);

    } else {
      // Modifying existing attendance
      if (existingAtt.status === status) {
        // No status change, just update notes
        db.prepare('UPDATE student_attendance SET notes = ? WHERE id = ?').run(notes || null, existingAtt.id);
        return;
      }

      if (existingAtt.status === 'absent' && status === 'present') {
        // Switched from absent to present:
        // Now counts as day completed (+1), and revert previously added +1 calendar day from end date (-1)
        daysDiff = +1;
        daysToExtendGraduation = -1;
      } else if (existingAtt.status === 'present' && status === 'absent') {
        // Switched from present to absent:
        // Decrement completed day (-1), and add +1 calendar day extension (+1)
        daysDiff = -1;
        daysToExtendGraduation = +1;
      }

      db.prepare(`
        UPDATE student_attendance
        SET status = ?, notes = ?, instructor_id = ?
        WHERE id = ?
      `).run(status, notes || null, req.user.id, existingAtt.id);
    }

    // Apply updates to student
    let newDaysCompleted = Math.max(0, student.days_completed + daysDiff);

    // Compute updated expected_end_date
    let newExpectedEndDate = student.expected_end_date;
    if (daysToExtendGraduation !== 0) {
      const currentEnd = new Date(student.expected_end_date);
      currentEnd.setDate(currentEnd.getDate() + daysToExtendGraduation);
      newExpectedEndDate = currentEnd.toISOString().split('T')[0];
    }

    db.prepare(`
      UPDATE students
      SET days_completed = ?,
          expected_end_date = ?
      WHERE id = ?
    `).run(newDaysCompleted, newExpectedEndDate, student_id);
  });

  try {
    markTx();
    const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
    const updatedAtt = db.prepare('SELECT * FROM student_attendance WHERE student_id = ? AND date = ?').get(student_id, targetDate);

    res.json({
      success: true,
      attendance: updatedAtt,
      student: updatedStudent,
      message: status === 'absent' 
        ? `Marked Absent. Strategy A applied: Graduation extended to ${updatedStudent.expected_end_date} (+1 day).`
        : `Marked Present. Training days completed: ${updatedStudent.days_completed}/${updatedStudent.total_course_days}.`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ==========================================
// 2. STAFF ATTENDANCE (GEOFENCED CHECK-IN)
// ==========================================

// Get current user's today attendance status and branch coordinates
router.get('/staff/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const userId = req.user.id;

  const attendance = db.prepare(`
    SELECT sa.*, b.name as branch_name, b.latitude as branch_lat, b.longitude as branch_lon
    FROM staff_attendance sa
    JOIN branches b ON sa.branch_id = b.id
    WHERE sa.user_id = ? AND sa.date = ?
  `).get(userId, today);

  // Get max geofence radius from settings
  const radiusSetting = db.prepare("SELECT value FROM settings WHERE key = 'geofence_radius_meters'").get();
  const maxRadiusMeters = parseInt(radiusSetting ? radiusSetting.value : '100', 10);

  res.json({
    date: today,
    attendance: attendance || null,
    branch: {
      id: req.user.branch_id,
      name: req.user.branch_name,
      latitude: req.user.branch_lat,
      longitude: req.user.branch_lon
    },
    maxRadiusMeters
  });
});

// Staff Geofenced Check-In
router.post('/staff/checkin', (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Live GPS latitude and longitude are required for check-in.' });
  }

  const userId = req.user.id;
  const branchId = req.user.branch_id;

  if (!branchId) {
    return res.status(400).json({ error: 'User is not assigned to a physical branch for geofenced check-in.' });
  }

  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Assigned branch not found.' });
  }

  // Calculate distance using Haversine formula
  const distance = calculateDistanceMeters(
    Number(latitude),
    Number(longitude),
    Number(branch.latitude),
    Number(branch.longitude)
  );

  // Get configured geofence radius
  const radiusSetting = db.prepare("SELECT value FROM settings WHERE key = 'geofence_radius_meters'").get();
  const allowedRadius = parseInt(radiusSetting ? radiusSetting.value : '100', 10);

  const isVerified = distance <= allowedRadius;

  if (!isVerified) {
    return res.status(403).json({
      error: `Geofence check failed: You are ${distance}m away from ${branch.name}. Check-in is only permitted within ${allowedRadius}m.`
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().split(' ')[0];

  try {
    const upsert = db.prepare(`
      INSERT INTO staff_attendance (
        user_id, branch_id, date, check_in_time, check_in_lat, check_in_lon, distance_meters, status, is_geofence_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'present', 1)
      ON CONFLICT(user_id, date) DO UPDATE SET
        check_in_time = COALESCE(check_in_time, excluded.check_in_time),
        check_in_lat = excluded.check_in_lat,
        check_in_lon = excluded.check_in_lon,
        distance_meters = excluded.distance_meters,
        is_geofence_verified = 1
    `);

    upsert.run(userId, branchId, today, nowTime, latitude, longitude, distance);
    const updated = db.prepare('SELECT * FROM staff_attendance WHERE user_id = ? AND date = ?').get(userId, today);

    res.json({
      success: true,
      message: `✅ Geofence verified! Checked in at ${nowTime} (${distance}m from branch).`,
      attendance: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Staff Check-Out
router.post('/staff/checkout', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().split(' ')[0];
  const userId = req.user.id;

  const existing = db.prepare('SELECT * FROM staff_attendance WHERE user_id = ? AND date = ?').get(userId, today);
  if (!existing || !existing.check_in_time) {
    return res.status(400).json({ error: 'You must check in before checking out.' });
  }

  try {
    db.prepare(`
      UPDATE staff_attendance
      SET check_out_time = ?
      WHERE user_id = ? AND date = ?
    `).run(nowTime, userId, today);

    const updated = db.prepare('SELECT * FROM staff_attendance WHERE user_id = ? AND date = ?').get(userId, today);
    res.json({ success: true, message: `Checked out at ${nowTime}.`, attendance: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Staff personal attendance history
router.get('/staff/history', (req, res) => {
  const userId = req.query.user_id ? parseInt(req.query.user_id, 10) : req.user.id;
  const month = req.query.month; // e.g. '2026-11'

  let query = `
    SELECT sa.*, b.name as branch_name
    FROM staff_attendance sa
    JOIN branches b ON sa.branch_id = b.id
    WHERE sa.user_id = ?
  `;
  const params = [userId];

  if (month) {
    query += ' AND sa.date LIKE ?';
    params.push(`${month}%`);
  }

  query += ' ORDER BY sa.date DESC';
  const history = db.prepare(query).all(...params);

  res.json({ history });
});

module.exports = router;
