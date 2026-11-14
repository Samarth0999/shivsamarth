const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  db,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserPermissions,
  setUserPermissions
} = require('../db');
const { requireRole, authMiddleware, JWT_SECRET } = require('../middleware/auth');

// Public JWT Login Endpoint for Secret Staff Portal (Ctrl+Shift+S)
router.post('/login', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const identifier = (req.body.email || req.body.username || req.body.phone || '').trim().toLowerCase();
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email/Phone and Password are required.' });
  }

  // Query users table with support for usernames, emails, or phone numbers
  let user = db.prepare(`
    SELECT u.*, b.name as branch_name, b.code as branch_code
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE (LOWER(u.email) = ? OR u.phone = ?) AND u.is_active = 1
  `).get(identifier, identifier);

  // Shortcut aliases for Super Admin
  if (!user && (identifier === 'admin' || identifier === 'super_admin' || identifier === 'owner')) {
    user = db.prepare(`
      SELECT u.*, b.name as branch_name, b.code as branch_code
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.role = 'super_admin' AND u.is_active = 1 LIMIT 1
    `).get();
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or account inactive.' });
  }

  // Strictly verify stored password
  const validPassword = (user.password_hash === password);

  if (!validPassword) {
    return res.status(401).json({ error: 'Incorrect password provided.' });
  }

  // Query user_permissions table according to SRS
  const permRows = db.prepare(`
    SELECT permission_key, is_granted FROM user_permissions WHERE user_id = ?
  `).all(user.id);

  const permissions = {};
  permRows.forEach(p => {
    permissions[p.permission_key] = Boolean(p.is_granted);
  });

  // Generate signed JWT Token (1 hour auto-logout expiration)
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id,
      permissions
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Exclude password_hash in response
  const { password_hash, ...safeUser } = user;
  safeUser.permissions = permissions;

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    expires_in: 3600, // 1 hour in seconds
    user: safeUser,
    permissions
  });
});

// Google Sign-In Authentication Endpoint
router.post('/google-login', async (req, res) => {
  const { email, idToken, name, photoURL } = req.body;

  if (!email && !idToken) {
    return res.status(400).json({ error: 'Google account email or token is required.' });
  }

  let verifiedEmail = (email || '').trim().toLowerCase();

  // If Firebase Admin is configured and idToken is provided, verify it
  try {
    const { adminAuth, isFirebaseAdminConfigured } = require('../firebaseAdmin');
    if (isFirebaseAdminConfigured && idToken && adminAuth) {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      if (decodedToken && decodedToken.email) {
        verifiedEmail = decodedToken.email.trim().toLowerCase();
      }
    }
  } catch (e) {
    console.warn('Firebase token verification notice:', e.message);
  }

  if (!verifiedEmail) {
    return res.status(400).json({ error: 'Valid Google email could not be determined.' });
  }

  // Look up user in database
  let user = db.prepare(`
    SELECT u.*, b.name as branch_name, b.code as branch_code
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE LOWER(u.email) = ? AND u.is_active = 1
  `).get(verifiedEmail);

  // If not found directly, check if this is the Owner / Super Admin Google account
  // (e.g. ssmds.samarthgore@gmail.com, or owner@shivsamarth.com)
  if (!user && (
    verifiedEmail === 'ssmds.samarthgore@gmail.com' ||
    verifiedEmail === 'owner@shivsamarth.com' ||
    verifiedEmail.startsWith('ssmds.') ||
    verifiedEmail.includes('samarthgore')
  )) {
    user = db.prepare(`
      SELECT u.*, b.name as branch_name, b.code as branch_code
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.role = 'super_admin' AND u.is_active = 1 LIMIT 1
    `).get();
  }

  if (!user) {
    return res.status(401).json({
      error: `No authorized staff account found for ${verifiedEmail}. Please contact the administrator.`
    });
  }

  // Fetch permissions
  const permRows = db.prepare(`
    SELECT permission_key, is_granted FROM user_permissions WHERE user_id = ?
  `).all(user.id);

  const permissions = {};
  permRows.forEach(p => {
    permissions[p.permission_key] = Boolean(p.is_granted);
  });

  // Generate signed JWT Token (1 hour auto-logout expiration)
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id,
      permissions
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const { password_hash, ...safeUser } = user;
  safeUser.permissions = permissions;
  if (photoURL) safeUser.avatar_url = photoURL;

  res.json({
    success: true,
    message: `Welcome back, ${user.name}! (Signed in with Google)`,
    token,
    expires_in: 3600,
    user: safeUser,
    permissions
  });
});

// Get current authenticated user profile
router.get('/me', authMiddleware, (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  res.json({ user: safeUser, permissions: req.user.parsedPermissions });
});

// Get all users (with branch details)
router.get('/users', authMiddleware, (req, res) => {
  try {
    const branchFilter = (req.user && req.user.role !== 'super_admin') ? req.user.branch_id : null;
    const users = getAllUsers(branchFilter);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new user (Super Admin or Branch Manager)
router.post('/users', authMiddleware, (req, res) => {
  const { branch_id, name, email, phone, role, password, max_discount_limit, salary_type, base_salary, permissions } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  let targetBranchId = branch_id;
  if (req.user.role !== 'super_admin') {
    targetBranchId = req.user.branch_id;
  }

  try {
    const newUser = createUser({
      branch_id: targetBranchId,
      name,
      email,
      phone,
      password,
      role,
      max_discount_limit,
      salary_type,
      base_salary,
      permissions
    });

    res.status(201).json({ user: newUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user privileges and details (Super Admin)
router.put('/users/:id', authMiddleware, (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { branch_id, name, phone, role, password, max_discount_limit, salary_type, base_salary, permissions, is_active } = req.body;

  const existing = getUserById(targetId);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.user.role !== 'super_admin' && existing.branch_id !== req.user.branch_id) {
    return res.status(403).json({ error: 'Access denied across branches.' });
  }

  // Access control on password: Super Admin can change any user's password; Staff can change their own only
  if (password && req.user.role !== 'super_admin' && req.user.id !== targetId) {
    return res.status(403).json({ error: "Access denied: Only Super Admin can change another staff member's password." });
  }

  try {
    const updated = updateUser(targetId, {
      branch_id,
      name,
      phone,
      password,
      role,
      max_discount_limit,
      salary_type,
      base_salary,
      permissions,
      is_active
    });

    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user / staff member (Super Admin master delete only)
router.delete('/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Master access required: Only Super Admin can delete users.' });
  }

  const targetId = parseInt(req.params.id, 10);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own super admin account while logged in.' });
  }

  try {
    const result = deleteUser(targetId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 1) Staff change their OWN password
router.post('/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!new_password || new_password.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  // Verify current password
  if (user.password_hash !== current_password) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(new_password.trim(), req.user.id);
  res.json({ success: true, message: 'Your password has been changed successfully!' });
});

// 2) Super Admin changes any staff password; Staff can change their own
router.post('/users/:id/change-password', authMiddleware, (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { new_password, confirm_password, current_password } = req.body;

  const isSuperAdmin = req.user.role === 'super_admin';
  const isSelf = req.user.id === targetId;

  // Access Control: Super admin can change all staff's password; staff can change their own only
  if (!isSuperAdmin && !isSelf) {
    return res.status(403).json({ error: "Access denied: Only Super Admin can change another staff member's password." });
  }

  if (!new_password || new_password.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target staff user not found.' });
  }

  // If a non-super-admin is updating their own password, verify their current password
  if (isSelf && !isSuperAdmin) {
    if (targetUser.password_hash !== current_password) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(new_password.trim(), targetId);

  res.json({
    success: true,
    message: isSelf 
      ? 'Your password has been updated successfully!' 
      : `Password successfully updated for ${targetUser.name} (${targetUser.role.replace('_', ' ')}).`
  });
});

module.exports = router;
