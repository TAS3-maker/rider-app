const { requireAuth, requireRole } = require('./auth');
const { ROLES } = require('../config/constants');

// Convenience: authenticate then require the admin role.
const adminAuth = [requireAuth, requireRole(ROLES.ADMIN)];

module.exports = { adminAuth };
