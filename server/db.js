const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'driving_school.sqlite');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for high performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initializeDatabase() {
  db.exec(`
    -- Branches
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Users / Staff
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT DEFAULT 'password123',
      role TEXT NOT NULL, -- 'super_admin', 'branch_manager', 'instructor', 'office_staff'
      max_discount_limit REAL DEFAULT 0,
      salary_type TEXT DEFAULT 'monthly', -- 'monthly' or 'daily'
      base_salary REAL DEFAULT 18000,
      permissions TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Granular User Permissions Table (as defined in SRS)
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_key TEXT NOT NULL,
      is_granted INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, permission_key)
    );

    -- Dynamic System Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );

    -- Course Types
    CREATE TABLE IF NOT EXISTS course_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 26,
      base_fee REAL NOT NULL DEFAULT 8500,
      is_license_course INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Payment Modes
    CREATE TABLE IF NOT EXISTS payment_modes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    -- Expense Categories
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    -- Vehicles
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      reg_number TEXT UNIQUE NOT NULL,
      model TEXT NOT NULL,
      fuel_type TEXT DEFAULT 'Petrol',
      status TEXT DEFAULT 'active', -- 'active', 'maintenance'
      insurance_expiry TEXT,
      puc_expiry TEXT,
      fitness_expiry TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Batches (1-Hour Slots)
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      is_active INTEGER DEFAULT 1
    );

    -- Vehicle Rotations (Weekly / Bi-weekly rotational fleet schedule)
    CREATE TABLE IF NOT EXISTS vehicle_rotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Students
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enroll_id TEXT UNIQUE NOT NULL,
      branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      course_type_id INTEGER NOT NULL REFERENCES course_types(id),
      primary_instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      gender TEXT DEFAULT 'Male',
      dob TEXT,
      address TEXT,
      admission_date TEXT NOT NULL,
      expected_end_date TEXT NOT NULL,
      base_fee REAL NOT NULL,
      discount_given REAL DEFAULT 0,
      net_total_fee REAL NOT NULL,
      total_paid REAL DEFAULT 0,
      pending_balance REAL NOT NULL,
      days_completed INTEGER DEFAULT 0,
      total_course_days INTEGER DEFAULT 26,
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'dropped'
      created_by_user_id INTEGER REFERENCES users(id),
      
      -- Conditional RTO fields
      is_license_course INTEGER DEFAULT 1,
      ll_application_no TEXT,
      ll_receipt_no TEXT,
      ll_receipt_amount REAL DEFAULT 0,
      ll_issue_date TEXT,
      ll_expiry_date TEXT,
      dl_application_no TEXT,
      dl_receipt_no TEXT,
      dl_receipt_amount REAL DEFAULT 0,
      dl_number TEXT,
      dl_expiry_date TEXT,
      rto_test_status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'passed', 'failed'
      rto_test_date TEXT,
      last_whatsapp_reminder_at TEXT,
      last_review_request_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Leads & Inquiries (connected from website enquiry & booking modal)
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      course_id TEXT,
      course_name TEXT,
      preferred_time TEXT,
      address TEXT,
      message TEXT,
      source TEXT DEFAULT 'contact_form', -- 'contact_form', 'booking_modal', 'walk_in'
      status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'lost'
      assigned_to_user_id INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Student Payments
    CREATE TABLE IF NOT EXISTS student_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      receipt_no TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      collected_by_user_id INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Student Attendance (Strategy A Engine)
    CREATE TABLE IF NOT EXISTS student_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES batches(id),
      instructor_id INTEGER REFERENCES users(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL, -- 'present', 'absent'
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(student_id, date)
    );

    -- Staff Attendance (Geofenced Check-in)
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      check_in_time TEXT,
      check_out_time TEXT,
      check_in_lat REAL,
      check_in_lon REAL,
      distance_meters REAL,
      status TEXT DEFAULT 'present', -- 'present', 'half_day', 'absent'
      is_geofence_verified INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, date)
    );

    -- Staff Salary Advances
    CREATE TABLE IF NOT EXISTS staff_advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'Cash',
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Payroll Records
    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month_year TEXT NOT NULL, -- 'YYYY-MM'
      salary_type TEXT NOT NULL,
      base_salary REAL NOT NULL,
      days_in_month INTEGER NOT NULL,
      days_present REAL NOT NULL,
      days_present_override REAL,
      gross_pay REAL NOT NULL,
      advances_deducted REAL DEFAULT 0,
      incentives REAL DEFAULT 0,
      net_payable REAL NOT NULL,
      status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid'
      paid_date TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, month_year)
    );

    -- Daily Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'Cash',
      date TEXT NOT NULL,
      logged_by_user_id INTEGER REFERENCES users(id),
      receipt_ref TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Enrollment Sequences for atomic branch-year auto-numbering
    CREATE TABLE IF NOT EXISTS enroll_sequences (
      branch_code TEXT NOT NULL,
      year INTEGER NOT NULL,
      current_sequence INTEGER DEFAULT 0,
      PRIMARY KEY (branch_code, year)
    );
  `);

  // Ensure all columns exist in users table for existing databases
  try { db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT 'password123';`); } catch (e) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN max_discount_limit REAL DEFAULT 0;`); } catch (e) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN salary_type TEXT DEFAULT 'monthly';`); } catch (e) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN base_salary REAL DEFAULT 18000;`); } catch (e) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}';`); } catch (e) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;`); } catch (e) {}

  seedInitialData();
  seedPermissionsAndLeads();
}

// Function to generate the next branch-coded sequential Enroll ID atomically
function getNextEnrollId(branchId) {
  const branch = db.prepare('SELECT code FROM branches WHERE id = ?').get(branchId);
  if (!branch) throw new Error('Branch not found for Enroll ID generation');

  const currentYear = new Date().getFullYear();
  const branchCode = branch.code.toUpperCase();

  const getSeq = db.prepare('SELECT current_sequence FROM enroll_sequences WHERE branch_code = ? AND year = ?');
  const insertSeq = db.prepare('INSERT INTO enroll_sequences (branch_code, year, current_sequence) VALUES (?, ?, 1)');
  const updateSeq = db.prepare('UPDATE enroll_sequences SET current_sequence = current_sequence + 1 WHERE branch_code = ? AND year = ?');

  const row = getSeq.get(branchCode, currentYear);
  let nextSeq = 1;

  if (!row) {
    insertSeq.run(branchCode, currentYear);
    nextSeq = 1;
  } else {
    updateSeq.run(branchCode, currentYear);
    const updated = getSeq.get(branchCode, currentYear);
    nextSeq = updated.current_sequence;
  }

  const padded = String(nextSeq).padStart(3, '0');
  return `${branchCode}-${currentYear}-${padded}`;
}

function seedPermissionsAndLeads() {
  // 1. Seed user_permissions if empty
  const permCount = db.prepare('SELECT COUNT(*) as count FROM user_permissions').get().count;
  if (permCount === 0) {
    console.log('🛡️ Seeding granular user_permissions according to SRS...');
    const users = db.prepare('SELECT id, role FROM users').all();
    const insertPerm = db.prepare(`
      INSERT OR IGNORE INTO user_permissions (user_id, permission_key, is_granted)
      VALUES (?, ?, 1)
    `);

    users.forEach(u => {
      if (u.role === 'super_admin') {
        [
          'view_leads', 'manage_leads', 'manage_students', 'manage_vehicles',
          'manage_batches', 'process_refunds', 'delete_payments', 'edit_expenses',
          'send_whatsapp_alerts', 'view_attendance', 'mark_attendance',
          'admin_settings', 'view_payroll', 'manage_payroll'
        ].forEach(p => insertPerm.run(u.id, p));
      } else if (u.role === 'branch_manager') {
        [
          'view_leads', 'manage_leads', 'manage_students', 'manage_vehicles',
          'manage_batches', 'edit_expenses', 'send_whatsapp_alerts',
          'view_attendance', 'mark_attendance', 'view_payroll'
        ].forEach(p => insertPerm.run(u.id, p));
      } else if (u.role === 'instructor') {
        [
          'view_attendance', 'mark_attendance', 'geofence_checkin',
          'view_wages', 'whatsapp_reminders'
        ].forEach(p => insertPerm.run(u.id, p));
      } else if (u.role === 'office_staff') {
        [
          'view_leads', 'manage_leads', 'manage_students',
          'collect_fees', 'send_whatsapp_alerts'
        ].forEach(p => insertPerm.run(u.id, p));
      }
    });
  }
}

function seedInitialData() {
  const branchCount = db.prepare('SELECT COUNT(*) as count FROM branches').get().count;
  if (branchCount > 0) return; // Already seeded

  console.log('🌱 Seeding initial driving school data...');

  // 1. Branches (ShivSamarth Main Branch & ShriYash Branch in Beed)
  const insertBranch = db.prepare(`
    INSERT INTO branches (code, name, address, phone, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const beed = insertBranch.run('SSMB', 'ShivSamarth Main Branch', 'Satyabhama Complex, Infront of Rashtrwadi Bhawan, Swaraj Nagar, Beed, Maharashtra 431122', '8507075555', 18.9894, 75.7601);
  const shriyash = insertBranch.run('SYBR', 'ShriYash Branch', 'Infront of Lokmat office, Sahayog Nagar, Beed, Maharashtra 431122', '9420635355', 18.9930, 75.7580);

  // 2. Settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)');
  insertSetting.run('day_10_warning_threshold', '10', 'Number of completed training days to trigger fee warning');
  insertSetting.run('risk_low_remaining_days', '15', 'Remaining days threshold for low financial risk');
  insertSetting.run('risk_high_remaining_days', '5', 'Remaining days threshold for high financial risk');
  insertSetting.run('geofence_radius_meters', '100', 'Maximum allowed distance in meters for staff attendance check-in');
  insertSetting.run('app_name', 'ShivSamarth Motor Driving School', 'Application Brand Name');
  insertSetting.run('whatsapp_fee_reminder_template', 'Namaste {student_name}, Greetings from {school_name} ({branch_name}). You have completed Day {days_completed}/{total_days} of your driving course. Your pending fee balance is ₹{pending_balance}. Please settle this balance at the branch office to ensure smooth RTO test scheduling. Thank you!', 'WhatsApp fee reminder text template');
  insertSetting.run('google_review_url', 'https://g.page/r/shivsamarth-driving-school/review', 'Google Business Profile Review Link');
  insertSetting.run('google_review_trigger_days', '3', 'Remaining course days threshold to trigger Google review WhatsApp invitation');
  insertSetting.run('whatsapp_google_review_template', 'Namaste {student_name}! 🚗✨ Congratulations on nearing the completion of your driving course (Day {days_completed}/{total_days}) at {school_name} ({branch_name})!\n\nWe hope you had a great experience learning to drive safely with our certified instructors. Could you please take 1 minute to share your feedback and give us a 5-star Google Review here?\n\n⭐ Review Link: {google_review_link}\n\nYour review helps our team grow and guides future learners. Thank you & happy safe driving! 🌟', 'WhatsApp Google Review Message Template');

  // 3. Course Types
  const insertCourse = db.prepare(`
    INSERT INTO course_types (name, duration_days, base_fee, is_license_course, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  const c1 = insertCourse.run('Car 4-Wheeler Training (26 Days) + Permanent DL', 26, 7000, 1, 'Full 26-day on-road practical driving plus RTO Learner and Driving License assistance.');
  const c2 = insertCourse.run('Car 4-Wheeler Practice Only (26 Days, No License)', 26, 4000, 0, 'Full 26-day on-road practical driving sessions for licensed drivers.');
  const c3 = insertCourse.run('Only License (Documentation & RTO Assistance)', 1, 3500, 1, 'Complete documentation, medical certificate, test appointment booking, and RTO exam clearance assistance.');

  // 4. Payment Modes
  const insertMode = db.prepare('INSERT INTO payment_modes (name) VALUES (?)');
  ['Cash', 'UPI', 'Card', 'Bank Transfer'].forEach(mode => insertMode.run(mode));

  // 5. Expense Categories
  const insertExpCat = db.prepare('INSERT INTO expense_categories (name) VALUES (?)');
  ['Fuel', 'Vehicle Maintenance', 'Repairs', 'Tea / Refreshments', 'RTO Fees', 'Office Supplies'].forEach(cat => insertExpCat.run(cat));

  // 6. Users
  const defaultPermissions = {
    view_leads: true,
    manage_leads: true,
    manage_students: true,
    manage_vehicles: true,
    manage_batches: true,
    process_refunds: true,
    delete_payments: true,
    edit_expenses: true,
    send_whatsapp_alerts: true
  };

  const insertUser = db.prepare(`
    INSERT INTO users (branch_id, name, email, phone, password_hash, role, max_discount_limit, salary_type, base_salary, permissions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Super Admin / Owner
  const uSuper = insertUser.run(
    null,
    'Samarth Gore (Owner)',
    'owner@shivsamarth.com',
    '9370107031',
    'Sam@2007',
    'super_admin',
    100000,
    'monthly',
    50000,
    JSON.stringify(defaultPermissions)
  );

  // Beed Branch Manager
  const uBeedMgr = insertUser.run(
    beed.lastInsertRowid,
    'Rameshwar Kade (ShriYash Manager)',
    'rameshwar.shri@shivsamarth.com',
    '9405799009',
    'Shri@2026',
    'branch_manager',
    3000,
    'monthly',
    25000,
    JSON.stringify({ ...defaultPermissions, delete_payments: false })
  );

  // ShriYash Branch Manager
  const uShriYashMgr = insertUser.run(
    shriyash.lastInsertRowid,
    'Nitin Shirole (ShriYash Manager)',
    'shriyash.mgr@shivsamarth.com',
    '9420635355',
    'shriyash123',
    'branch_manager',
    3000,
    'monthly',
    28000,
    JSON.stringify({ ...defaultPermissions, delete_payments: false })
  );

  // Instructors
  const uInstRajesh = insertUser.run(
    beed.lastInsertRowid,
    'Rajesh Patil (Lead Instructor)',
    'rajesh.inst@shivsamarth.com',
    '9822333333',
    'inst123',
    'instructor',
    0,
    'monthly',
    18000,
    JSON.stringify({
      student_attendance: true,
      view_assigned_roster: true,
      whatsapp_reminders: true,
      geofence_checkin: true
    })
  );

  const uInstAmit = insertUser.run(
    beed.lastInsertRowid,
    'Amit Shinde (Instructor)',
    'amit.inst@shivsamarth.com',
    '9822444444',
    'inst123',
    'instructor',
    0,
    'daily',
    700,
    JSON.stringify({
      student_attendance: true,
      view_assigned_roster: true,
      whatsapp_reminders: true,
      geofence_checkin: true
    })
  );

  const uInstPriya = insertUser.run(
    shriyash.lastInsertRowid,
    'Priya Joshi (Instructor)',
    'priya.inst@shivsamarth.com',
    '9822555555',
    'inst123',
    'instructor',
    0,
    'monthly',
    19000,
    JSON.stringify({
      student_attendance: true,
      view_assigned_roster: true,
      whatsapp_reminders: true,
      geofence_checkin: true
    })
  );

  // Office Staff
  const uStaffBeed = insertUser.run(
    beed.lastInsertRowid,
    'Pooja More (Counselor)',
    'pooja.beed@shivsamarth.com',
    '9822666666',
    'staff123',
    'office_staff',
    1000,
    'monthly',
    15000,
    JSON.stringify({
      view_leads: true,
      manage_leads: true,
      manage_students: true,
      collect_fees: true,
      send_whatsapp_alerts: true
    })
  );

  // 7. Vehicles (Beed Main Branch & ShriYash Branch)
  const insertVeh = db.prepare(`
    INSERT INTO vehicles (branch_id, reg_number, model, fuel_type, status, insurance_expiry, puc_expiry, fitness_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVeh.run(beed.lastInsertRowid, 'MH-23-AJ-1024', 'Maruti Suzuki Brezza (Manual)', 'Diesel', 'active', '2027-08-15', '2027-03-10', '2028-11-01');
  insertVeh.run(beed.lastInsertRowid, 'MH-23-BK-4512', 'Hyundai Grand i10 (Manual)', 'Petrol', 'active', '2027-05-20', '2027-02-14', '2028-09-15');
  insertVeh.run(shriyash.lastInsertRowid, 'MH-23-CY-5521', 'Maruti Suzuki Brezza (Manual)', 'Petrol', 'active', '2027-10-10', '2027-04-25', '2029-01-10');
  insertVeh.run(shriyash.lastInsertRowid, 'MH-23-DZ-7788', 'Tata Nexon (Manual)', 'Diesel', 'active', '2027-12-01', '2027-06-18', '2029-05-20');

  // 8. Batches (Standard Operational Time Slots)
  const insertBatch = db.prepare(`
    INSERT INTO batches (branch_id, name, time_slot, capacity, instructor_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const slots = [
    '08:00 AM - 11:00 AM',
    '11:00 AM - 02:00 PM',
    '02:00 PM - 05:00 PM',
    '05:00 PM - 08:00 PM'
  ];

  slots.forEach((slot, idx) => {
    const defaultInst = idx % 2 === 0 ? uInstRajesh.lastInsertRowid : uInstAmit.lastInsertRowid;
    insertBatch.run(beed.lastInsertRowid, `Batch ${idx + 1} (${slot.split(' ')[0]})`, slot, 4, defaultInst);
  });

  slots.forEach((slot, idx) => {
    insertBatch.run(shriyash.lastInsertRowid, `ShriYash Batch ${idx + 1} (${slot.split(' ')[0]})`, slot, 4, uInstPriya.lastInsertRowid);
  });

  console.log('✅ Production database tables and branch master configuration initialized cleanly!');
}

initializeDatabase();

// Ensure instructor_id column exists on batches in existing database
try {
  db.prepare('ALTER TABLE batches ADD COLUMN instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL').run();
} catch (e) { }

// Ensure days_present_override column exists on payroll_records in existing database
try {
  db.prepare('ALTER TABLE payroll_records ADD COLUMN days_present_override REAL').run();
} catch (e) { }

// Ensure last_review_request_at column exists on students in existing database
try {
  db.prepare('ALTER TABLE students ADD COLUMN last_review_request_at TEXT').run();
} catch (e) { }

// Ensure Google review default settings exist in existing database
try {
  const insertSettingIfMissing = db.prepare('INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)');
  insertSettingIfMissing.run('google_review_url', 'https://g.page/r/shivsamarth-driving-school/review', 'Google Business Profile Review Link');
  insertSettingIfMissing.run('google_review_trigger_days', '3', 'Remaining course days threshold to trigger Google review WhatsApp invitation');
  insertSettingIfMissing.run('whatsapp_google_review_template', 'Namaste {student_name}! 🚗✨ Congratulations on nearing the completion of your driving course (Day {days_completed}/{total_days}) at {school_name} ({branch_name})!\n\nWe hope you had a great experience learning to drive safely with our certified instructors. Could you please take 1 minute to share your feedback and give us a 5-star Google Review here?\n\n⭐ Review Link: {google_review_link}\n\nYour review helps our team grow and guides future learners. Thank you & happy safe driving! 🌟', 'WhatsApp Google Review Message Template');
} catch (e) { }

// ==========================================
// USER MANAGEMENT & RBAC PERSISTENCE API
// ==========================================

function getUserPermissions(userId) {
  const permMap = {};
  const perms = db.prepare('SELECT permission_key, is_granted FROM user_permissions WHERE user_id = ?').all(userId);
  perms.forEach(p => {
    permMap[p.permission_key] = Boolean(p.is_granted);
  });
  return permMap;
}

function setUserPermissions(userId, permissions) {
  if (!permissions || typeof permissions !== 'object') return {};

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET permissions = ? WHERE id = ?').run(JSON.stringify(permissions), userId);

    const upsertPerm = db.prepare(`
      INSERT INTO user_permissions (user_id, permission_key, is_granted)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, permission_key) DO UPDATE SET is_granted = excluded.is_granted
    `);

    for (const [key, val] of Object.entries(permissions)) {
      upsertPerm.run(userId, key, val ? 1 : 0);
    }
  });

  tx();
  return getUserPermissions(userId);
}

function getAllUsers(branchFilter = null) {
  let query = `
    SELECT u.id, u.branch_id, u.name, u.email, u.phone, u.role, u.max_discount_limit,
           u.salary_type, u.base_salary, u.is_active, u.created_at,
           b.name as branch_name, b.code as branch_code
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
  `;
  const params = [];

  if (branchFilter) {
    query += ' WHERE u.branch_id = ?';
    params.push(branchFilter);
  }

  query += ' ORDER BY u.role, u.name';
  const users = db.prepare(query).all(...params);

  return users.map(u => ({
    ...u,
    permissions: getUserPermissions(u.id)
  }));
}

function getUserById(userId) {
  const user = db.prepare(`
    SELECT u.id, u.branch_id, u.name, u.email, u.phone, u.role, u.max_discount_limit,
           u.salary_type, u.base_salary, u.is_active, u.created_at, u.password_hash,
           b.name as branch_name, b.code as branch_code
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `).get(userId);

  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  safeUser.permissions = getUserPermissions(user.id);
  return safeUser;
}

function createUser(userData) {
  const {
    branch_id,
    name,
    email,
    phone,
    password,
    role,
    max_discount_limit,
    salary_type,
    base_salary,
    permissions
  } = userData;

  if (!name || !email || !role) {
    throw new Error('Name, email, and role are required.');
  }

  const tx = db.transaction(() => {
    const insert = db.prepare(`
      INSERT INTO users (
        branch_id, name, email, phone, password_hash, role,
        max_discount_limit, salary_type, base_salary, permissions, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insert.run(
      branch_id || null,
      name.trim(),
      email.trim().toLowerCase(),
      phone || null,
      password || 'password123',
      role,
      Number(max_discount_limit) || 0,
      salary_type || 'monthly',
      Number(base_salary) || 18000,
      JSON.stringify(permissions || {})
    );

    const newUserId = result.lastInsertRowid;

    if (permissions && typeof permissions === 'object') {
      const insertPerm = db.prepare(`
        INSERT INTO user_permissions (user_id, permission_key, is_granted)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, permission_key) DO UPDATE SET is_granted = excluded.is_granted
      `);
      for (const [key, val] of Object.entries(permissions)) {
        insertPerm.run(newUserId, key, val ? 1 : 0);
      }
    }

    return newUserId;
  });

  const newId = tx();
  return getUserById(newId);
}

function updateUser(userId, userData) {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!existing) {
    throw new Error('User not found.');
  }

  const {
    branch_id,
    name,
    phone,
    role,
    password,
    max_discount_limit,
    salary_type,
    base_salary,
    permissions,
    is_active
  } = userData;

  const tx = db.transaction(() => {
    const update = db.prepare(`
      UPDATE users
      SET branch_id = COALESCE(?, branch_id),
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          password_hash = COALESCE(?, password_hash),
          role = COALESCE(?, role),
          max_discount_limit = COALESCE(?, max_discount_limit),
          salary_type = COALESCE(?, salary_type),
          base_salary = COALESCE(?, base_salary),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);

    update.run(
      branch_id !== undefined ? (branch_id ? Number(branch_id) : null) : existing.branch_id,
      name ? name.trim() : existing.name,
      phone !== undefined ? phone : existing.phone,
      password || existing.password_hash,
      role || existing.role,
      max_discount_limit !== undefined ? Number(max_discount_limit) : existing.max_discount_limit,
      salary_type || existing.salary_type,
      base_salary !== undefined ? Number(base_salary) : existing.base_salary,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      userId
    );

    if (permissions && typeof permissions === 'object') {
      db.prepare('UPDATE users SET permissions = ? WHERE id = ?').run(JSON.stringify(permissions), userId);

      const upsertPerm = db.prepare(`
        INSERT INTO user_permissions (user_id, permission_key, is_granted)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, permission_key) DO UPDATE SET is_granted = excluded.is_granted
      `);
      for (const [key, val] of Object.entries(permissions)) {
        upsertPerm.run(userId, key, val ? 1 : 0);
      }
    }
  });

  tx();
  return getUserById(userId);
}

function deleteUser(userId) {
  const existing = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(userId);
  if (!existing) {
    throw new Error('User not found.');
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(userId);
    db.prepare('UPDATE batches SET instructor_id = NULL WHERE instructor_id = ?').run(userId);
    db.prepare('UPDATE students SET primary_instructor_id = NULL WHERE primary_instructor_id = ?').run(userId);
    try { db.prepare('UPDATE leads SET assigned_to_user_id = NULL WHERE assigned_to_user_id = ?').run(userId); } catch (e) { }
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  tx();
  return { success: true, message: `Staff account "${existing.name}" deleted successfully.` };
}

module.exports = {
  db,
  getNextEnrollId,
  // User Management Methods
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserPermissions,
  setUserPermissions
};
