const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user._id.toString(),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.ACCESS_TOKEN_TTL,
    algorithm: 'HS256',
  });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ error: 'Forbidden' });
}

// Verify a raw JWT (used by the Socket.IO handshake). Throws on failure.
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

module.exports = { signAccessToken, requireAuth, requireRole, verifyToken };
