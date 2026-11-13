const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getAuthorizedBranchFilter, requireRole } = require('../middleware/auth');

// Get authorized branches
router.get('/', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);

  if (branchFilter.isAll) {
    const branches = db.prepare('SELECT * FROM branches ORDER BY name').all();
    return res.json({ branches });
  } else {
    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchFilter.branchId);
    return res.json({ branches: branch ? [branch] : [] });
  }
});

// Get branch stats summary for master dashboard
router.get('/stats', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);

  let branchQuery = 'SELECT * FROM branches';
  const params = [];

  if (!branchFilter.isAll) {
    branchQuery += ' WHERE id = ?';
    params.push(branchFilter.branchId);
  }

  const branches = db.prepare(branchQuery).all(...params);

  const stats = branches.map(b => {
    const studentStats = db.prepare(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_students,
        SUM(net_total_fee) as total_booked_revenue,
        SUM(total_paid) as total_collected,
        SUM(pending_balance) as total_pending
      FROM students
      WHERE branch_id = ?
    `).get(b.id);

    const expenseStats = db.prepare(`
      SELECT SUM(amount) as total_expenses FROM expenses WHERE branch_id = ?
    `).get(b.id);

    const vehicleCount = db.prepare(`
      SELECT COUNT(*) as count FROM vehicles WHERE branch_id = ? AND status = 'active'
    `).get(b.id).count;

    const staffCount = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE branch_id = ? AND is_active = 1
    `).get(b.id).count;

    const isSuperAdmin = req.user.role === 'super_admin';
    const canExpenses = isSuperAdmin || Boolean(req.user.parsedPermissions?.view_expenses || req.user.parsedPermissions?.edit_expenses);

    const baseData = {
      ...b,
      total_students: studentStats.total_students || 0,
      active_students: studentStats.active_students || 0,
      total_booked_revenue: studentStats.total_booked_revenue || 0,
      total_collected: studentStats.total_collected || 0,
      total_pending: studentStats.total_pending || 0,
      active_vehicles: vehicleCount,
      active_staff: staffCount
    };

    if (canExpenses) {
      baseData.total_expenses = expenseStats.total_expenses || 0;
    }
    if (isSuperAdmin) {
      baseData.net_profit = (studentStats.total_collected || 0) - (expenseStats.total_expenses || 0);
    }

    return baseData;
  });

  res.json({ stats });
});

// Create new branch (Super Admin only)
router.post('/', requireRole(['super_admin']), (req, res) => {
  const { code, name, address, phone, latitude, longitude, google_review_url } = req.body;

  if (!code || !name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Code, Name, Latitude and Longitude are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO branches (code, name, address, phone, latitude, longitude, google_review_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      code.toUpperCase(),
      name,
      address || null,
      phone || null,
      latitude,
      longitude,
      google_review_url ? google_review_url.trim() : null
    );
    const newBranch = db.prepare('SELECT * FROM branches WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ branch: newBranch });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update branch coordinates and details (Super Admin)
router.put('/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { code, name, address, phone, latitude, longitude, google_review_url } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const newCode = code !== undefined ? code.trim().toUpperCase() : existing.code;
    const newName = name !== undefined ? name.trim() : existing.name;
    const newAddress = address !== undefined ? address : existing.address;
    const newPhone = phone !== undefined ? phone : existing.phone;
    const newLat = latitude !== undefined ? latitude : existing.latitude;
    const newLng = longitude !== undefined ? longitude : existing.longitude;
    const newReviewUrl = google_review_url !== undefined ? (google_review_url ? google_review_url.trim() : null) : existing.google_review_url;

    const update = db.prepare(`
      UPDATE branches
      SET code = ?,
          name = ?,
          address = ?,
          phone = ?,
          latitude = ?,
          longitude = ?,
          google_review_url = ?
      WHERE id = ?
    `);

    update.run(newCode, newName, newAddress, newPhone, newLat, newLng, newReviewUrl, id);
    const updated = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
    res.json({ branch: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete branch (Super Admin only - safely blocks if students are attached)
router.delete('/:id', requireRole(['super_admin']), (req, res) => {
  const id = parseInt(req.params.id, 10);

  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE branch_id = ?').get(id).count;
  if (studentCount > 0) {
    return res.status(400).json({ 
      error: `Cannot delete branch with ${studentCount} active enrolled students. Please reassign or graduate students first.` 
    });
  }

  const staffCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE branch_id = ?').get(id).count;
  if (staffCount > 0) {
    return res.status(400).json({ 
      error: `Cannot delete branch with ${staffCount} assigned staff members. Please reassign staff first.` 
    });
  }

  try {
    db.prepare('DELETE FROM branches WHERE id = ?').run(id);
    res.json({ success: true, message: 'Branch deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
