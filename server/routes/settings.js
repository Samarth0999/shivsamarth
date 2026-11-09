const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireRole } = require('../middleware/auth');

// Get all system settings, course types, payment modes, and expense categories
router.get('/', (req, res) => {
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(row => {
    settings[row.key] = row.value;
  });

  const courseTypes = db.prepare('SELECT * FROM course_types ORDER BY is_active DESC, name ASC').all();
  const paymentModes = db.prepare('SELECT * FROM payment_modes ORDER BY is_active DESC, name ASC').all();
  const expenseCategories = db.prepare('SELECT * FROM expense_categories ORDER BY is_active DESC, name ASC').all();

  res.json({
    settings,
    courseTypes,
    paymentModes,
    expenseCategories
  });
});

// Update dynamic system settings (Super Admin only)
router.post('/', requireRole(['super_admin']), (req, res) => {
  const settingsObj = req.body;

  const upsert = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const runAll = db.transaction((entries) => {
    for (const [key, val] of Object.entries(entries)) {
      upsert.run(key, String(val));
    }
  });

  try {
    runAll(settingsObj);
    const updated = db.prepare('SELECT * FROM settings').all();
    const result = {};
    updated.forEach(r => { result[r.key] = r.value; });
    res.json({ success: true, settings: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 1. COURSE TYPES CRUD
// ==========================================

// Create Course Type
router.post('/course-types', requireRole(['super_admin']), (req, res) => {
  const { name, duration_days, base_fee, is_license_course, description } = req.body;
  if (!name || !duration_days || !base_fee) {
    return res.status(400).json({ error: 'Name, duration days, and base fee are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO course_types (name, duration_days, base_fee, is_license_course, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    const r = insert.run(name.trim(), Number(duration_days), Number(base_fee), is_license_course ? 1 : 0, description || '');
    const created = db.prepare('SELECT * FROM course_types WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({ courseType: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit Course Type
router.put('/course-types/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, duration_days, base_fee, is_license_course, is_active, description } = req.body;

  const existing = db.prepare('SELECT * FROM course_types WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Course package not found.' });
  }

  try {
    const update = db.prepare(`
      UPDATE course_types
      SET name = COALESCE(?, name),
          duration_days = COALESCE(?, duration_days),
          base_fee = COALESCE(?, base_fee),
          is_license_course = COALESCE(?, is_license_course),
          is_active = COALESCE(?, is_active),
          description = COALESCE(?, description)
      WHERE id = ?
    `);
    update.run(
      name !== undefined ? name.trim() : existing.name,
      duration_days !== undefined ? Number(duration_days) : existing.duration_days,
      base_fee !== undefined ? Number(base_fee) : existing.base_fee,
      is_license_course !== undefined ? (is_license_course ? 1 : 0) : existing.is_license_course,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      description !== undefined ? description : existing.description,
      id
    );
    const updated = db.prepare('SELECT * FROM course_types WHERE id = ?').get(id);
    res.json({ success: true, courseType: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Course Type
router.delete('/course-types/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);

  const existing = db.prepare('SELECT * FROM course_types WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Course package not found.' });
  }

  // Check if students are linked to this course type
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE course_type_id = ?').get(id).count;

  try {
    if (studentCount > 0) {
      // Deactivate to protect student historical records
      db.prepare('UPDATE course_types SET is_active = 0 WHERE id = ?').run(id);
      return res.json({
        success: true,
        deactivated: true,
        message: `Course package has ${studentCount} registered student(s). To preserve student history and RTO records, it has been marked inactive instead of permanently deleted.`
      });
    } else {
      // Safe to delete completely
      db.prepare('DELETE FROM course_types WHERE id = ?').run(id);
      return res.json({ success: true, message: `Course package "${existing.name}" has been permanently deleted.` });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 2. PAYMENT MODES CRUD
// ==========================================

// Create Payment Mode
router.post('/payment-modes', requireRole(['super_admin']), (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Payment mode name is required.' });

  try {
    const insert = db.prepare('INSERT INTO payment_modes (name, is_active) VALUES (?, 1)');
    const r = insert.run(name.trim());
    res.status(201).json({ mode: { id: r.lastInsertRowid, name: name.trim(), is_active: 1 } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit Payment Mode
router.put('/payment-modes/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, is_active } = req.body;

  const existing = db.prepare('SELECT * FROM payment_modes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Payment mode not found.' });

  const newName = name !== undefined ? name.trim() : existing.name;
  const newActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

  try {
    const editTx = db.transaction(() => {
      // Update payment mode
      db.prepare('UPDATE payment_modes SET name = ?, is_active = ? WHERE id = ?').run(newName, newActive, id);

      // If name changed, optionally update historical records to preserve consistency
      if (newName !== existing.name) {
        db.prepare('UPDATE student_payments SET payment_mode = ? WHERE payment_mode = ?').run(newName, existing.name);
        db.prepare('UPDATE expenses SET payment_mode = ? WHERE payment_mode = ?').run(newName, existing.name);
        db.prepare('UPDATE staff_advances SET payment_mode = ? WHERE payment_mode = ?').run(newName, existing.name);
      }
    });

    editTx();
    const updated = db.prepare('SELECT * FROM payment_modes WHERE id = ?').get(id);
    res.json({ success: true, mode: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Payment Mode
router.delete('/payment-modes/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM payment_modes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Payment mode not found.' });

  try {
    db.prepare('DELETE FROM payment_modes WHERE id = ?').run(id);
    res.json({ success: true, message: `Payment mode "${existing.name}" deleted successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. EXPENSE CATEGORIES CRUD
// ==========================================

// Create Expense Category
router.post('/expense-categories', requireRole(['super_admin']), (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Expense category name is required.' });

  try {
    const insert = db.prepare('INSERT INTO expense_categories (name, is_active) VALUES (?, 1)');
    const r = insert.run(name.trim());
    res.status(201).json({ category: { id: r.lastInsertRowid, name: name.trim(), is_active: 1 } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit Expense Category
router.put('/expense-categories/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, is_active } = req.body;

  const existing = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Expense category not found.' });

  const newName = name !== undefined ? name.trim() : existing.name;
  const newActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

  try {
    const editTx = db.transaction(() => {
      db.prepare('UPDATE expense_categories SET name = ?, is_active = ? WHERE id = ?').run(newName, newActive, id);

      // If name changed, update historical expense rows
      if (newName !== existing.name) {
        db.prepare('UPDATE expenses SET category = ? WHERE category = ?').run(newName, existing.name);
      }
    });

    editTx();
    const updated = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(id);
    res.json({ success: true, category: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Expense Category
router.delete('/expense-categories/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Expense category not found.' });

  try {
    db.prepare('DELETE FROM expense_categories WHERE id = ?').run(id);
    res.json({ success: true, message: `Expense category "${existing.name}" deleted successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
