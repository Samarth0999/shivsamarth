const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'shivsamarth_jwt_secret_key_2026_super_secure';

function authMiddleware(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  let userId = null;
  let decodedUser = null;

  // 1. Check for Bearer JWT token in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      decodedUser = jwt.verify(token, JWT_SECRET, { clockTolerance: 300 });
      userId = decodedUser.id;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired JWT authentication token' });
    }
  }

  // 2. Fallback to x-user-id or query param userId for testing
  if (!userId) {
    userId = req.headers['x-user-id'] || req.query.userId || 1;
  }

  let user = db.prepare(`
    SELECT u.*, b.name as branch_name, b.code as branch_code, b.latitude as branch_lat, b.longitude as branch_lon
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ? AND u.is_active = 1
  `).get(userId);

  // Fallback: If user ID changed or container reseeded, match by verified email or phone from JWT
  if (!user && decodedUser && (decodedUser.email || decodedUser.phone)) {
    user = db.prepare(`
      SELECT u.*, b.name as branch_name, b.code as branch_code, b.latitude as branch_lat, b.longitude as branch_lon
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE (LOWER(u.email) = ? OR u.phone = ?) AND u.is_active = 1
    `).get((decodedUser.email || '').toLowerCase(), decodedUser.phone || '');
  }

  if (!user) {
    return res.status(401).json({ error: 'User not authenticated or inactive' });
  }

  const permissionsMap = {};

  // 1. Initial fallback to legacy JSON if present
  try {
    const jsonPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || {});
    Object.assign(permissionsMap, jsonPerms);
  } catch (e) {}

  // 2. Authoritative user_permissions table overrides legacy JSON
  const permRows = db.prepare(`
    SELECT permission_key, is_granted FROM user_permissions WHERE user_id = ?
  `).all(userId);

  permRows.forEach(p => {
    permissionsMap[p.permission_key] = Boolean(p.is_granted);
  });

  user.parsedPermissions = permissionsMap;
  user.permissionsList = Object.keys(permissionsMap).filter(k => permissionsMap[k]);

  req.user = user;
  next();
}

function getAuthorizedBranchFilter(req) {
  if (req.user.role === 'super_admin') {
    const requestedBranchId = req.query.branchId ? parseInt(req.query.branchId, 10) : null;
    return requestedBranchId ? { branchId: requestedBranchId, isAll: false } : { branchId: null, isAll: true };
  } else {
    return { branchId: req.user.branch_id, isAll: false };
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: role ${req.user.role} is not authorized for this action.` });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  getAuthorizedBranchFilter,
  requireRole,
  JWT_SECRET
};
