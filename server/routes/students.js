const express = require('express');
const router = express.Router();
const { db, getNextEnrollId } = require('../db');
const { getAuthorizedBranchFilter } = require('../middleware/auth');

// Helper to compute dynamic financial risk category
function computeFinancialRisk(student, settings) {
  const lowThreshold = parseInt(settings.risk_low_remaining_days || '15', 10);
  const highThreshold = parseInt(settings.risk_high_remaining_days || '5', 10);
  const day10Threshold = parseInt(settings.day_10_warning_threshold || '10', 10);
  const reviewTriggerDays = parseInt(settings.google_review_trigger_days || '3', 10);

  const remainingDays = Math.max(0, student.total_course_days - student.days_completed);
  const isDay10Warning = student.days_completed >= day10Threshold && student.pending_balance > 0;

  // Course is about to complete when remainingDays <= reviewTriggerDays or days_completed >= total_course_days
  const isNearingCompletion = (remainingDays <= reviewTriggerDays && student.days_completed >= Math.max(1, student.total_course_days - reviewTriggerDays)) || (student.days_completed >= student.total_course_days);

  let riskLevel = 'LOW'; // 'LOW', 'MEDIUM', 'HIGH'
  let riskColor = 'green';

  if (student.pending_balance === 0 || remainingDays >= lowThreshold) {
    riskLevel = 'LOW';
    riskColor = 'green';
  } else if (remainingDays <= highThreshold && student.pending_balance > 0) {
    riskLevel = 'HIGH';
    riskColor = 'red';
  } else if (remainingDays > highThreshold && remainingDays < lowThreshold && (student.total_paid < (student.net_total_fee * 0.5))) {
    riskLevel = 'MEDIUM';
    riskColor = 'amber';
  } else if (student.pending_balance > 0) {
    riskLevel = 'MEDIUM';
    riskColor = 'amber';
  }

  // RTO Hard Gate check:
  // Must complete 100% course days AND pending balance must be 0
  const isRtoGateUnlocked = (student.days_completed >= student.total_course_days) && (student.pending_balance <= 0);

  return {
    remainingDays,
    isDay10Warning,
    isNearingCompletion,
    riskLevel,
    riskColor,
    isRtoGateUnlocked
  };
}

// Get students list with filters, branch isolation, and risk analytics
router.get('/', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);
  const { status, risk, day10Only, nearingCompletionOnly, batchId, search } = req.query;

  // Read current system settings
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  let query = `
    SELECT 
      s.*,
      b.name as branch_name,
      b.code as branch_code,
      b.google_review_url as branch_google_review_url,
      c.name as course_name,
      c.duration_days as course_duration,
      u.name as instructor_name,
      u.phone as instructor_phone,
      bt.name as batch_name,
      bt.time_slot as batch_time_slot,
      v.model as current_vehicle_model,
      v.reg_number as current_vehicle_reg
    FROM students s
    JOIN branches b ON s.branch_id = b.id
    JOIN course_types c ON s.course_type_id = c.id
    LEFT JOIN users u ON s.primary_instructor_id = u.id
    LEFT JOIN batches bt ON s.batch_id = bt.id
    LEFT JOIN vehicle_rotations vr ON vr.batch_id = bt.id AND date('now', 'localtime') BETWEEN vr.start_date AND vr.end_date
    LEFT JOIN vehicles v ON vr.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND s.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }

  if (batchId) {
    query += ' AND s.batch_id = ?';
    params.push(batchId);
  }

  if (search) {
    query += ' AND (s.name LIKE ? OR s.phone LIKE ? OR s.enroll_id LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY s.id DESC';

  const rows = db.prepare(query).all(...params);

  // Augment each student with risk matrix and RTO gate status
  let students = rows.map(s => {
    const riskData = computeFinancialRisk(s, settings);
    return {
      ...s,
      ...riskData
    };
  });

  // Filter in memory for risk or day10 if requested
  if (day10Only === 'true') {
    students = students.filter(s => s.isDay10Warning);
  }

  if (nearingCompletionOnly === 'true') {
    students = students.filter(s => s.isNearingCompletion);
  }

  if (risk) {
    students = students.filter(s => s.riskLevel === risk.toUpperCase());
  }

  res.json({ students, count: students.length });
});

// Get single student profile with payments & attendance history
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  let query = `
    SELECT 
      s.*,
      b.name as branch_name,
      b.code as branch_code,
      b.google_review_url as branch_google_review_url,
      c.name as course_name,
      u.name as instructor_name,
      u.phone as instructor_phone,
      bt.name as batch_name,
      bt.time_slot as batch_time_slot,
      v.model as current_vehicle_model,
      v.reg_number as current_vehicle_reg
    FROM students s
    JOIN branches b ON s.branch_id = b.id
    JOIN course_types c ON s.course_type_id = c.id
    LEFT JOIN users u ON s.primary_instructor_id = u.id
    LEFT JOIN batches bt ON s.batch_id = bt.id
    LEFT JOIN vehicle_rotations vr ON vr.batch_id = bt.id AND date('now', 'localtime') BETWEEN vr.start_date AND vr.end_date
    LEFT JOIN vehicles v ON vr.vehicle_id = v.id
    WHERE s.id = ?
  `;
  const params = [id];

  if (!branchFilter.isAll) {
    query += ' AND s.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  const student = db.prepare(query).get(...params);
  if (!student) {
    return res.status(404).json({ error: 'Student not found or unauthorized' });
  }

  // Get payments
  const payments = db.prepare(`
    SELECT p.*, u.name as collected_by_name
    FROM student_payments p
    LEFT JOIN users u ON p.collected_by_user_id = u.id
    WHERE p.student_id = ?
    ORDER BY p.payment_date DESC, p.id DESC
  `).all(id);

  // Get attendance logs
  const attendance = db.prepare(`
    SELECT a.*, u.name as instructor_name
    FROM student_attendance a
    LEFT JOIN users u ON a.instructor_id = u.id
    WHERE a.student_id = ?
    ORDER BY a.date DESC
  `).all(id);

  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  const riskData = computeFinancialRisk(student, settings);

  res.json({
    student: {
      ...student,
      ...riskData
    },
    payments,
    attendance
  });
});

// Register new student (Module 4 & Module 1 Auto-Branch Assignment)
router.post('/', (req, res) => {
  const {
    course_type_id,
    primary_instructor_id,
    batch_id,
    name,
    phone,
    email,
    gender,
    dob,
    address,
    admission_date,
    discount_given,
    advance_paid,
    advance_payment_mode,
    // Conditional RTO details
    ll_application_no,
    ll_receipt_no,
    ll_receipt_amount,
    ll_issue_date,
    ll_expiry_date,
    dl_application_no,
    dl_receipt_no,
    dl_receipt_amount,
    dl_number,
    dl_expiry_date
  } = req.body;

  if (!course_type_id || !name || !phone) {
    return res.status(400).json({ error: 'Course Type, Student Name, and Contact Phone are required.' });
  }

  // Module 1: Auto-Branch Assignment
  // If user is not super_admin, force to user's branch_id. If super_admin, allow specifying branch_id or default to 1.
  let targetBranchId = req.user.branch_id;
  if (req.user.role === 'super_admin') {
    targetBranchId = req.body.branch_id ? parseInt(req.body.branch_id, 10) : 1;
  }

  if (!targetBranchId) {
    return res.status(400).json({ error: 'Target branch is required.' });
  }

  // Validate Course Type
  const course = db.prepare('SELECT * FROM course_types WHERE id = ?').get(course_type_id);
  if (!course) {
    return res.status(400).json({ error: 'Selected course type does not exist.' });
  }

  // Module 4: Controlled Pricing & Discount Validation
  const baseFee = Number(course.base_fee);
  const discount = Math.max(0, Number(discount_given) || 0);

  // Validate discount limit against staff's assigned max_discount_limit
  if (req.user.role !== 'super_admin') {
    const maxLimit = Number(req.user.max_discount_limit || 0);
    if (discount > maxLimit) {
      return res.status(400).json({
        error: `Discount ₹${discount} exceeds your maximum authorized discount limit of ₹${maxLimit}.`
      });
    }
  }

  const netTotalFee = Math.max(0, baseFee - discount);
  const advance = Math.max(0, Number(advance_paid) || 0);
  const pendingBalance = Math.max(0, netTotalFee - advance);

  // Calculate expected graduation end date (admission_date + course.duration_days - 1 calendar days)
  const admDateObj = new Date(admission_date || new Date().toISOString().split('T')[0]);
  const endDateObj = new Date(admDateObj);
  endDateObj.setDate(endDateObj.getDate() + (course.duration_days - 1));
  const expectedEndDate = endDateObj.toISOString().split('T')[0];
  const formattedAdmDate = admDateObj.toISOString().split('T')[0];

  // Check batch slot capacity
  if (batch_id) {
    const batch = db.prepare('SELECT capacity FROM batches WHERE id = ?').get(batch_id);
    const currentEnrolled = db.prepare(`
      SELECT COUNT(*) as count FROM students WHERE batch_id = ? AND status = 'active'
    `).get(batch_id).count;

    if (batch && currentEnrolled >= batch.capacity) {
      return res.status(400).json({
        error: `Batch slot capacity limit (${batch.capacity} students) reached. Please choose another slot.`
      });
    }
  }

  // Transaction for atomic enroll ID generation, student creation, and advance payment receipt
  const createStudentTx = db.transaction(() => {
    // Generate branch-coded, sequence-locked read-only format (e.g. BEED-2026-001)
    const enrollId = getNextEnrollId(targetBranchId);

    const insertStudentStmt = db.prepare(`
      INSERT INTO students (
        enroll_id, branch_id, course_type_id, primary_instructor_id, batch_id,
        name, phone, email, gender, dob, address, admission_date, expected_end_date,
        base_fee, discount_given, net_total_fee, total_paid, pending_balance,
        days_completed, total_course_days, status, created_by_user_id,
        is_license_course, ll_application_no, ll_receipt_no, ll_receipt_amount,
        ll_issue_date, ll_expiry_date, dl_application_no, dl_receipt_no, dl_receipt_amount,
        dl_number, dl_expiry_date, rto_test_status
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    // Auto-resolve instructor directly from the selected batch slot
    let assignedInstructor = primary_instructor_id || null;
    if (batch_id && !assignedInstructor) {
      const bRow = db.prepare('SELECT instructor_id FROM batches WHERE id = ?').get(batch_id);
      if (bRow && bRow.instructor_id) {
        assignedInstructor = bRow.instructor_id;
      }
    }

    const result = insertStudentStmt.run(
      enrollId,
      targetBranchId,
      course_type_id,
      assignedInstructor,
      batch_id || null,
      name.trim(),
      phone.trim(),
      email ? email.trim() : null,
      gender || 'Male',
      dob || null,
      address || null,
      formattedAdmDate,
      expectedEndDate,
      baseFee,
      discount,
      netTotalFee,
      advance,
      pendingBalance,
      0, // days_completed starts at 0
      course.duration_days,
      'active',
      req.user.id,
      course.is_license_course,
      ll_application_no || null,
      ll_receipt_no || null,
      Number(ll_receipt_amount) || 0,
      ll_issue_date || null,
      ll_expiry_date || null,
      dl_application_no || null,
      dl_receipt_no || null,
      Number(dl_receipt_amount) || 0,
      dl_number || null,
      dl_expiry_date || null,
      'pending'
    );

    const newStudentId = result.lastInsertRowid;

    // Record advance payment receipt if advance_paid > 0
    if (advance > 0) {
      const receiptNo = `RCPT-${enrollId}`;
      db.prepare(`
        INSERT INTO student_payments (student_id, receipt_no, amount, payment_mode, payment_date, collected_by_user_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        newStudentId,
        receiptNo,
        advance,
        advance_payment_mode || 'Cash',
        formattedAdmDate,
        req.user.id,
        'Initial advance payment recorded at admission'
      );
    }

    return newStudentId;
  });

  try {
    const studentId = createStudentTx();
    const createdStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    res.status(201).json({ success: true, student: createdStudent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update student profile and dynamic RTO details
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Student not found' });
  }

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied: student belongs to another branch.' });
  }

  const {
    name, phone, email, gender, dob, address, primary_instructor_id, batch_id, status,
    ll_application_no, ll_receipt_no, ll_receipt_amount, ll_issue_date, ll_expiry_date,
    dl_application_no, dl_receipt_no, dl_receipt_amount, dl_number, dl_expiry_date,
    rto_test_status, rto_test_date,
    // Master Super Admin overrides
    branch_id, net_total_fee, pending_balance, days_completed, total_course_days, admission_date, expected_end_date
  } = req.body;

  // Access Control: require manage_students permission or super_admin
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.manage_students) {
    return res.status(403).json({ error: 'Permission denied: manage_students right required.' });
  }

  // Module 6: RTO Test Hard Gate Validation (Super Admin can bypass if needed)
  if (rto_test_status === 'scheduled' && req.user.role !== 'super_admin') {
    if (existing.days_completed < existing.total_course_days || existing.pending_balance > 0) {
      return res.status(400).json({
        error: `RTO Test Hard Gate: Cannot schedule RTO driving test until course training is 100% complete (${existing.days_completed}/${existing.total_course_days} days) AND pending balance is ₹0 (currently ₹${existing.pending_balance} pending).`
      });
    }
  }

  try {
    const isSuperAdmin = req.user.role === 'super_admin';

    const update = db.prepare(`
      UPDATE students
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          gender = COALESCE(?, gender),
          dob = COALESCE(?, dob),
          address = COALESCE(?, address),
          primary_instructor_id = COALESCE(?, primary_instructor_id),
          batch_id = COALESCE(?, batch_id),
          status = COALESCE(?, status),
          ll_application_no = COALESCE(?, ll_application_no),
          ll_receipt_no = COALESCE(?, ll_receipt_no),
          ll_receipt_amount = COALESCE(?, ll_receipt_amount),
          ll_issue_date = COALESCE(?, ll_issue_date),
          ll_expiry_date = COALESCE(?, ll_expiry_date),
          dl_application_no = COALESCE(?, dl_application_no),
          dl_receipt_no = COALESCE(?, dl_receipt_no),
          dl_receipt_amount = COALESCE(?, dl_receipt_amount),
          dl_number = COALESCE(?, dl_number),
          dl_expiry_date = COALESCE(?, dl_expiry_date),
          rto_test_status = COALESCE(?, rto_test_status),
          rto_test_date = COALESCE(?, rto_test_date),
          branch_id = CASE WHEN ? THEN COALESCE(?, branch_id) ELSE branch_id END,
          net_total_fee = CASE WHEN ? THEN COALESCE(?, net_total_fee) ELSE net_total_fee END,
          pending_balance = CASE WHEN ? THEN COALESCE(?, pending_balance) ELSE pending_balance END,
          days_completed = CASE WHEN ? THEN COALESCE(?, days_completed) ELSE days_completed END,
          total_course_days = CASE WHEN ? THEN COALESCE(?, total_course_days) ELSE total_course_days END,
          admission_date = CASE WHEN ? THEN COALESCE(?, admission_date) ELSE admission_date END,
          expected_end_date = CASE WHEN ? THEN COALESCE(?, expected_end_date) ELSE expected_end_date END
      WHERE id = ?
    `);

    let finalInstructorId = primary_instructor_id !== undefined ? primary_instructor_id : existing.primary_instructor_id;
    if (batch_id && batch_id !== existing.batch_id && primary_instructor_id === undefined) {
      const bRow = db.prepare('SELECT instructor_id FROM batches WHERE id = ?').get(batch_id);
      if (bRow && bRow.instructor_id) {
        finalInstructorId = bRow.instructor_id;
      }
    }

    update.run(
      name, phone, email, gender, dob, address,
      finalInstructorId,
      batch_id !== undefined ? batch_id : existing.batch_id,
      status || existing.status,
      ll_application_no, ll_receipt_no, ll_receipt_amount !== undefined ? Number(ll_receipt_amount) : existing.ll_receipt_amount,
      ll_issue_date, ll_expiry_date,
      dl_application_no, dl_receipt_no, dl_receipt_amount !== undefined ? Number(dl_receipt_amount) : existing.dl_receipt_amount,
      dl_number, dl_expiry_date,
      rto_test_status, rto_test_date,
      isSuperAdmin ? 1 : 0, branch_id,
      isSuperAdmin ? 1 : 0, net_total_fee !== undefined ? Number(net_total_fee) : null,
      isSuperAdmin ? 1 : 0, pending_balance !== undefined ? Number(pending_balance) : null,
      isSuperAdmin ? 1 : 0, days_completed !== undefined ? Number(days_completed) : null,
      isSuperAdmin ? 1 : 0, total_course_days !== undefined ? Number(total_course_days) : null,
      isSuperAdmin ? 1 : 0, admission_date,
      isSuperAdmin ? 1 : 0, expected_end_date,
      id
    );

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.json({ success: true, student: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel or Reactivate Course for a student
router.post('/:id/cancel-course', (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  if (!branchFilter.isAll && student.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.manage_students) {
    return res.status(403).json({ error: 'Permission denied: manage_students right required.' });
  }

  const { action } = req.body;
  const targetStatus = action === 'reactivate' ? 'active' : 'cancelled';

  try {
    db.prepare('UPDATE students SET status = ? WHERE id = ?').run(targetStatus, studentId);
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    res.json({
      success: true,
      message: targetStatus === 'cancelled'
        ? `Course has been cancelled for ${student.name} (${student.enroll_id}).`
        : `Course has been reactivated for ${student.name} (${student.enroll_id}).`,
      student: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Record a Fee Payment
router.post('/:id/payments', (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  if (!branchFilter.isAll && student.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  // Access Control: require collect_payments or manage_students permission or super_admin
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.collect_payments && !req.user.parsedPermissions?.manage_students) {
    return res.status(403).json({ error: 'Permission denied: collect_payments right required.' });
  }

  const { amount, payment_mode, notes } = req.body;
  const payAmount = Number(amount);

  if (!payAmount || payAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  if (payAmount > student.pending_balance) {
    return res.status(400).json({
      error: `Payment amount ₹${payAmount} exceeds current pending balance ₹${student.pending_balance}.`
    });
  }

  const paymentDate = new Date().toISOString().split('T')[0];
  const receiptNo = `RCPT-${student.enroll_id}-${Date.now().toString().slice(-4)}`;

  const payTx = db.transaction(() => {
    // Insert payment record
    db.prepare(`
      INSERT INTO student_payments (student_id, receipt_no, amount, payment_mode, payment_date, collected_by_user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(studentId, receiptNo, payAmount, payment_mode || 'Cash', paymentDate, req.user.id, notes || null);

    // Update student balances
    const newTotalPaid = student.total_paid + payAmount;
    const newPending = Math.max(0, student.net_total_fee - newTotalPaid);

    db.prepare(`
      UPDATE students
      SET total_paid = ?,
          pending_balance = ?
      WHERE id = ?
    `).run(newTotalPaid, newPending, studentId);
  });

  try {
    payTx();
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    res.json({ success: true, student: updated, receipt_no: receiptNo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete student record (Super Admin Master Delete or with manage_students privilege)
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Student not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  // Access Control: require delete_students or manage_students permission or super_admin
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_students && !req.user.parsedPermissions?.manage_students) {
    return res.status(403).json({ error: 'Permission denied: delete_students or manage_students right required to delete.' });
  }

  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM student_attendance WHERE student_id = ?').run(id);
    db.prepare('DELETE FROM student_payments WHERE student_id = ?').run(id);
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
  });

  try {
    deleteTx();
    res.json({ success: true, message: `Student ${existing.name} (${existing.enroll_id}) deleted permanently.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit an existing fee payment receipt
router.put('/:id/payments/:paymentId', (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const paymentId = parseInt(req.params.paymentId, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  if (!branchFilter.isAll && student.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  // Access Control: Super Admin or edit_payments / delete_payments / process_refunds permission
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.edit_payments && !req.user.parsedPermissions?.delete_payments && !req.user.parsedPermissions?.process_refunds) {
    return res.status(403).json({ error: 'Permission denied: Authority to edit payments required.' });
  }

  const existingPayment = db.prepare('SELECT * FROM student_payments WHERE id = ? AND student_id = ?').get(paymentId, studentId);
  if (!existingPayment) return res.status(404).json({ error: 'Payment receipt not found.' });

  const { amount, payment_mode, notes, payment_date } = req.body;
  const newAmount = amount !== undefined ? Number(amount) : existingPayment.amount;

  if (isNaN(newAmount) || newAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  const editPayTx = db.transaction(() => {
    db.prepare(`
      UPDATE student_payments
      SET amount = ?,
          payment_mode = COALESCE(?, payment_mode),
          notes = COALESCE(?, notes),
          payment_date = COALESCE(?, payment_date)
      WHERE id = ?
    `).run(newAmount, payment_mode, notes, payment_date, paymentId);

    // Recalculate student total paid and pending balance
    const sumRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM student_payments WHERE student_id = ?').get(studentId);
    const newTotalPaid = sumRow.total;
    const newPending = Math.max(0, student.net_total_fee - newTotalPaid);

    db.prepare(`
      UPDATE students
      SET total_paid = ?,
          pending_balance = ?
      WHERE id = ?
    `).run(newTotalPaid, newPending, studentId);
  });

  try {
    editPayTx();
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    const updatedPayment = db.prepare('SELECT * FROM student_payments WHERE id = ?').get(paymentId);
    res.json({ success: true, payment: updatedPayment, student: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a fee payment receipt
router.delete('/:id/payments/:paymentId', (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const paymentId = parseInt(req.params.paymentId, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  if (!branchFilter.isAll && student.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  // Access Control: Super Admin or delete_payments / process_refunds permission
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_payments && !req.user.parsedPermissions?.process_refunds) {
    return res.status(403).json({ error: 'Permission denied: delete_payments right required.' });
  }

  const existingPayment = db.prepare('SELECT * FROM student_payments WHERE id = ? AND student_id = ?').get(paymentId, studentId);
  if (!existingPayment) return res.status(404).json({ error: 'Payment receipt not found.' });

  const deletePayTx = db.transaction(() => {
    db.prepare('DELETE FROM student_payments WHERE id = ?').run(paymentId);

    // Recalculate student total paid and pending balance
    const sumRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM student_payments WHERE student_id = ?').get(studentId);
    const newTotalPaid = sumRow.total;
    const newPending = Math.max(0, student.net_total_fee - newTotalPaid);

    db.prepare(`
      UPDATE students
      SET total_paid = ?,
          pending_balance = ?
      WHERE id = ?
    `).run(newTotalPaid, newPending, studentId);
  });

  try {
    deletePayTx();
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    res.json({ success: true, message: 'Payment receipt deleted successfully.', student: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Log WhatsApp reminder sent
router.post('/:id/whatsapp-reminder', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE students
    SET last_whatsapp_reminder_at = ?
    WHERE id = ?
  `).run(now, id);

  res.json({ success: true, sent_at: now });
});

// Log Google review request sent
router.post('/:id/google-review-request', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE students
    SET last_review_request_at = ?
    WHERE id = ?
  `).run(now, id);

  res.json({ success: true, sent_at: now });
});

module.exports = router;
