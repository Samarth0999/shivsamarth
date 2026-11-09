const express = require('express');
const router = express.Router();
const { db, getNextEnrollId } = require('../db');
const { authMiddleware, getAuthorizedBranchFilter } = require('../middleware/auth');

// 1. PUBLIC ENDPOINT: Submit Lead Inquiry or Demo Booking
router.post('/', (req, res) => {
  const { name, phone, email, course_id, course_name, preferred_time, address, message, source, branch_id } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone number are required.' });
  }

  // Validate 10-digit phone
  const cleanPhone = phone.replace(/[\s-+]/g, '').slice(-10);
  const targetBranchId = branch_id ? Number(branch_id) : 1; // Default to Beed Main Branch (1)

  try {
    const insert = db.prepare(`
      INSERT INTO leads (branch_id, name, phone, email, course_id, course_name, preferred_time, address, message, source, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `);

    const result = insert.run(
      targetBranchId,
      name.trim(),
      cleanPhone,
      email ? email.trim() : null,
      course_id || null,
      course_name || 'Practical Driving Training',
      preferred_time || null,
      address ? address.trim() : null,
      message ? message.trim() : null,
      source || 'contact_form'
    );

    res.status(201).json({
      success: true,
      lead_id: result.lastInsertRowid,
      message: `Thank you, ${name}! Your inquiry has been submitted. Our manager will contact you within 2 hours.`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. STAFF ENDPOINT: Get leads list (Requires Authentication)
router.get('/', authMiddleware, (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);
  const { status, search } = req.query;

  let query = `
    SELECT 
      l.*,
      b.name as branch_name,
      b.code as branch_code,
      u.name as assigned_to_name
    FROM leads l
    LEFT JOIN branches b ON l.branch_id = b.id
    LEFT JOIN users u ON l.assigned_to_user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND l.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  if (status && status !== 'all') {
    query += ' AND l.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.course_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY l.id DESC';

  const leads = db.prepare(query).all(...params);
  res.json({ leads, total: leads.length });
});

// 3. STAFF ENDPOINT: Update lead details (Requires Authentication, Super Admin or manage_leads)
router.put('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Lead not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  const { name, phone, email, course_name, preferred_time, address, status, assigned_to_user_id, notes, branch_id } = req.body;
  const targetBranchId = req.user.role === 'super_admin' && branch_id ? branch_id : existing.branch_id;

  try {
    const update = db.prepare(`
      UPDATE leads
      SET branch_id = ?,
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          course_name = COALESCE(?, course_name),
          preferred_time = COALESCE(?, preferred_time),
          address = COALESCE(?, address),
          status = COALESCE(?, status),
          assigned_to_user_id = COALESCE(?, assigned_to_user_id),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `);

    update.run(
      targetBranchId,
      name ? name.trim() : null,
      phone ? phone.replace(/[\s-+]/g, '').slice(-10) : null,
      email,
      course_name,
      preferred_time,
      address,
      status,
      assigned_to_user_id,
      notes,
      id
    );

    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete lead inquiry (Super admin or manage_leads permission)
router.delete('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Lead not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_leads && !req.user.parsedPermissions?.manage_leads) {
    return res.status(403).json({ error: 'Permission denied: delete_leads or manage_leads right required.' });
  }

  try {
    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    res.json({ success: true, message: `Lead inquiry for ${existing.name} deleted successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. STAFF ENDPOINT: Convert lead directly to enrolled student (Requires Authentication)
router.post('/:id/convert', authMiddleware, (req, res) => {
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.convert_leads && !req.user.parsedPermissions?.manage_leads) {
    return res.status(403).json({ error: 'Permission denied: convert_leads or manage_leads right required.' });
  }

  const leadId = parseInt(req.params.id, 10);
  const { course_type_id, batch_id, primary_instructor_id, advance_paid, discount_given } = req.body;

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  const targetCourseId = course_type_id || 1;
  const course = db.prepare('SELECT * FROM course_types WHERE id = ?').get(targetCourseId);
  if (!course) return res.status(400).json({ error: 'Selected course not found.' });

  const targetBranchId = lead.branch_id || req.user.branch_id || 1;

  const baseFee = Number(course.base_fee);
  const discount = Number(discount_given) || 0;
  const netTotalFee = Math.max(0, baseFee - discount);
  const advance = Number(advance_paid) || 0;
  const pending = Math.max(0, netTotalFee - advance);

  const admissionDate = new Date().toISOString().split('T')[0];
  const endDateObj = new Date();
  endDateObj.setDate(endDateObj.getDate() + (course.duration_days - 1));
  const expectedEndDate = endDateObj.toISOString().split('T')[0];

  const convertTx = db.transaction(() => {
    const enrollId = getNextEnrollId(targetBranchId);

    const insertStudent = db.prepare(`
      INSERT INTO students (
        enroll_id, branch_id, course_type_id, primary_instructor_id, batch_id,
        name, phone, email, address, admission_date, expected_end_date,
        base_fee, discount_given, net_total_fee, total_paid, pending_balance,
        days_completed, total_course_days, status, created_by_user_id,
        is_license_course, rto_test_status
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        0, ?, 'active', ?,
        ?, 'pending'
      )
    `);

    const result = insertStudent.run(
      enrollId, targetBranchId, targetCourseId, primary_instructor_id || null, batch_id || null,
      lead.name, lead.phone, lead.email, lead.address, admissionDate, expectedEndDate,
      baseFee, discount, netTotalFee, advance, pending,
      course.duration_days, req.user.id, course.is_license_course
    );

    const newStudentId = result.lastInsertRowid;

    if (advance > 0) {
      db.prepare(`
        INSERT INTO student_payments (student_id, receipt_no, amount, payment_mode, payment_date, collected_by_user_id, notes)
        VALUES (?, ?, ?, 'Cash', ?, ?, 'Initial token fee from converted inquiry')
      `).run(newStudentId, `RCPT-${enrollId}`, advance, admissionDate, req.user.id);
    }

    db.prepare("UPDATE leads SET status = 'converted' WHERE id = ?").run(leadId);

    return { studentId: newStudentId, enrollId };
  });

  try {
    const { studentId, enrollId } = convertTx();
    const createdStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    res.json({
      success: true,
      message: `Lead converted to student ${lead.name} (Enroll ID: ${enrollId})!`,
      student: createdStudent
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
