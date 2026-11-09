const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getAuthorizedBranchFilter, requireRole } = require('../middleware/auth');

// Get batch slots with live enrollment counts and active vehicle rotation
router.get('/', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);
  const today = new Date().toISOString().split('T')[0];

  let query = `
    SELECT 
      b.*,
      br.name as branch_name,
      br.code as branch_code,
      u.name as instructor_name,
      u.phone as instructor_phone,
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.status = 'active') as enrolled_count,
      v.id as active_vehicle_id,
      v.model as active_vehicle_model,
      v.reg_number as active_vehicle_reg,
      vr.start_date as rotation_start,
      vr.end_date as rotation_end
    FROM batches b
    JOIN branches br ON b.branch_id = br.id
    LEFT JOIN users u ON b.instructor_id = u.id
    LEFT JOIN vehicle_rotations vr ON vr.batch_id = b.id AND ? BETWEEN vr.start_date AND vr.end_date
    LEFT JOIN vehicles v ON vr.vehicle_id = v.id
    WHERE b.is_active = 1
  `;
  const params = [today];

  if (!branchFilter.isAll) {
    query += ' AND b.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  query += ' ORDER BY b.time_slot ASC';

  const batches = db.prepare(query).all(...params);

  // Fetch enrolled students per batch for roster preview
  const batchesWithStudents = batches.map(batch => {
    const students = db.prepare(`
      SELECT s.id, s.enroll_id, s.name, s.phone, s.days_completed, s.total_course_days, COALESCE(u.name, ?) as instructor_name
      FROM students s
      LEFT JOIN users u ON s.primary_instructor_id = u.id
      WHERE s.batch_id = ? AND s.status = 'active'
    `).all(batch.instructor_name || 'Assigned Instructor', batch.id);

    return {
      ...batch,
      students
    };
  });

  res.json({ batches: batchesWithStudents });
});

// Create new batch slot
router.post('/', (req, res) => {
  const { branch_id, instructor_id, name, time_slot, capacity } = req.body;

  let targetBranchId = branch_id;
  if (req.user.role !== 'super_admin') {
    targetBranchId = req.user.branch_id;
  }

  if (!time_slot || !targetBranchId) {
    return res.status(400).json({ error: 'Time slot and branch are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO batches (branch_id, instructor_id, name, time_slot, capacity)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      targetBranchId, 
      instructor_id ? Number(instructor_id) : null,
      name || `Slot (${time_slot})`, 
      time_slot, 
      capacity || 4
    );
    const created = db.prepare('SELECT * FROM batches WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ batch: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update batch slot (Super Admin master edit or with manage_batches permission)
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Batch not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_batches && !req.user.parsedPermissions?.manage_batches) {
    return res.status(403).json({ error: 'Permission denied: delete_batches or manage_batches right required.' });
  }

  const { branch_id, instructor_id, name, time_slot, capacity, is_active } = req.body;
  const targetBranchId = req.user.role === 'super_admin' && branch_id ? branch_id : existing.branch_id;
  const targetInstructorId = instructor_id !== undefined ? (instructor_id ? Number(instructor_id) : null) : existing.instructor_id;

  try {
    const update = db.prepare(`
      UPDATE batches
      SET branch_id = ?,
          instructor_id = ?,
          name = COALESCE(?, name),
          time_slot = COALESCE(?, time_slot),
          capacity = COALESCE(?, capacity),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);

    update.run(
      targetBranchId,
      targetInstructorId,
      name,
      time_slot,
      capacity !== undefined ? Number(capacity) : existing.capacity,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    // If instructor_id was updated, automatically sync students in this batch
    if (instructor_id !== undefined) {
      db.prepare('UPDATE students SET primary_instructor_id = ? WHERE batch_id = ?').run(targetInstructorId, id);
    }

    const updated = db.prepare(`
      SELECT b.*, u.name as instructor_name, u.phone as instructor_phone
      FROM batches b
      LEFT JOIN users u ON b.instructor_id = u.id
      WHERE b.id = ?
    `).get(id);
    res.json({ success: true, batch: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete batch slot (Super Admin master delete or with manage_batches permission)
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Batch not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_batches && !req.user.parsedPermissions?.manage_batches) {
    return res.status(403).json({ error: 'Permission denied: delete_batches or manage_batches right required.' });
  }

  const deleteTx = db.transaction(() => {
    // Unassign students from this batch
    db.prepare('UPDATE students SET batch_id = NULL WHERE batch_id = ?').run(id);
    // Delete rotations
    db.prepare('DELETE FROM vehicle_rotations WHERE batch_id = ?').run(id);
    // Delete batch
    db.prepare('DELETE FROM batches WHERE id = ?').run(id);
  });

  try {
    deleteTx();
    res.json({ success: true, message: `Batch slot "${existing.name}" (${existing.time_slot}) deleted successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// VEHICLES FLEET MANAGEMENT
// ==========================================

router.get('/vehicles', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);

  let query = `
    SELECT v.*, b.name as branch_name, b.code as branch_code
    FROM vehicles v
    JOIN branches b ON v.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND v.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  query += ' ORDER BY v.status ASC, v.reg_number ASC';
  const vehicles = db.prepare(query).all(...params);

  // Augment with operational expenses (Fuel + Maintenance costs)
  const augmented = vehicles.map(v => {
    const exp = db.prepare(`
      SELECT 
        SUM(CASE WHEN category = 'Fuel' THEN amount ELSE 0 END) as total_fuel_cost,
        SUM(CASE WHEN category IN ('Vehicle Maintenance', 'Repairs') THEN amount ELSE 0 END) as total_maintenance_cost,
        COUNT(*) as total_expense_entries
      FROM expenses
      WHERE vehicle_id = ?
    `).get(v.id);

    return {
      ...v,
      total_fuel_cost: exp.total_fuel_cost || 0,
      total_maintenance_cost: exp.total_maintenance_cost || 0,
      total_operational_cost: (exp.total_fuel_cost || 0) + (exp.total_maintenance_cost || 0)
    };
  });

  res.json({ vehicles: augmented });
});

router.post('/vehicles', (req, res) => {
  const { branch_id, reg_number, model, fuel_type, status, insurance_expiry, puc_expiry, fitness_expiry } = req.body;

  let targetBranchId = branch_id;
  if (req.user.role !== 'super_admin') {
    targetBranchId = req.user.branch_id;
  }

  if (!reg_number || !model || !targetBranchId) {
    return res.status(400).json({ error: 'Registration number, Model, and Branch are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO vehicles (branch_id, reg_number, model, fuel_type, status, insurance_expiry, puc_expiry, fitness_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      targetBranchId,
      reg_number.toUpperCase().trim(),
      model.trim(),
      fuel_type || 'Petrol',
      status || 'active',
      insurance_expiry || null,
      puc_expiry || null,
      fitness_expiry || null
    );

    const created = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ vehicle: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update vehicle details (Super Admin master edit or with manage_vehicles permission)
router.put('/vehicles/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_vehicles && !req.user.parsedPermissions?.manage_vehicles) {
    return res.status(403).json({ error: 'Permission denied: delete_vehicles or manage_vehicles right required.' });
  }

  const { branch_id, reg_number, model, fuel_type, status, insurance_expiry, puc_expiry, fitness_expiry } = req.body;
  const targetBranchId = req.user.role === 'super_admin' && branch_id ? branch_id : existing.branch_id;

  try {
    const update = db.prepare(`
      UPDATE vehicles
      SET branch_id = ?,
          reg_number = COALESCE(?, reg_number),
          model = COALESCE(?, model),
          fuel_type = COALESCE(?, fuel_type),
          status = COALESCE(?, status),
          insurance_expiry = COALESCE(?, insurance_expiry),
          puc_expiry = COALESCE(?, puc_expiry),
          fitness_expiry = COALESCE(?, fitness_expiry)
      WHERE id = ?
    `);

    update.run(
      targetBranchId,
      reg_number ? reg_number.toUpperCase().trim() : null,
      model ? model.trim() : null,
      fuel_type,
      status,
      insurance_expiry,
      puc_expiry,
      fitness_expiry,
      id
    );

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.json({ success: true, vehicle: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete vehicle from fleet (Super Admin master delete or with manage_vehicles permission)
router.delete('/vehicles/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const branchFilter = getAuthorizedBranchFilter(req);

  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

  if (!branchFilter.isAll && existing.branch_id !== branchFilter.branchId) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_vehicles && !req.user.parsedPermissions?.manage_vehicles) {
    return res.status(403).json({ error: 'Permission denied: delete_vehicles or manage_vehicles right required.' });
  }

  const deleteTx = db.transaction(() => {
    // Delete rotations
    db.prepare('DELETE FROM vehicle_rotations WHERE vehicle_id = ?').run(id);
    // Unassign vehicle from expenses
    db.prepare('UPDATE expenses SET vehicle_id = NULL WHERE vehicle_id = ?').run(id);
    // Delete vehicle
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
  });

  try {
    deleteTx();
    res.json({ success: true, message: `Vehicle "${existing.model}" (${existing.reg_number}) deleted from fleet.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ROTATIONAL FLEET SCHEDULE
// ==========================================

router.get('/rotations', (req, res) => {
  const branchFilter = getAuthorizedBranchFilter(req);

  let query = `
    SELECT 
      vr.*,
      b.name as batch_name,
      b.time_slot as batch_time_slot,
      v.model as vehicle_model,
      v.reg_number as vehicle_reg,
      br.name as branch_name
    FROM vehicle_rotations vr
    JOIN batches b ON vr.batch_id = b.id
    JOIN vehicles v ON vr.vehicle_id = v.id
    JOIN branches br ON b.branch_id = br.id
    WHERE 1=1
  `;
  const params = [];

  if (!branchFilter.isAll) {
    query += ' AND b.branch_id = ?';
    params.push(branchFilter.branchId);
  }

  query += ' ORDER BY vr.start_date DESC';
  const rotations = db.prepare(query).all(...params);
  res.json({ rotations });
});

router.post('/rotations', (req, res) => {
  const { batch_id, vehicle_id, start_date, end_date, notes } = req.body;

  if (!batch_id || !vehicle_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Batch, Vehicle, Start Date, and End Date are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO vehicle_rotations (batch_id, vehicle_id, start_date, end_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(batch_id, vehicle_id, start_date, end_date, notes || null);
    const created = db.prepare('SELECT * FROM vehicle_rotations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ rotation: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete vehicle rotation schedule entry
router.delete('/rotations/:id', (req, res) => {
  if (req.user.role !== 'super_admin' && !req.user.parsedPermissions?.delete_rotations && !req.user.parsedPermissions?.manage_rotations && !req.user.parsedPermissions?.manage_batches) {
    return res.status(403).json({ error: 'Permission denied: delete_rotations right required.' });
  }

  const id = parseInt(req.params.id, 10);
  try {
    db.prepare('DELETE FROM vehicle_rotations WHERE id = ?').run(id);
    res.json({ success: true, message: 'Rotation schedule entry removed.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
