const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { User, University } = require('../models');
const { signAccessToken } = require('../middleware/auth');

const COST = 10;
const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const gen6 = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const emailDomain = (email) => String(email).split('@')[1] || '';
const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v || '').trim());

function safeEqualHex(a, b) {
  if (!/^[0-9a-f]{64}$/.test(a || '') || !/^[0-9a-f]{64}$/.test(b || '')) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const username = String(req.body.username || '').trim();

    if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be 8–72 characters' });
    }

    // University domain verification against admin-configured allowed domains.
    const university = await University.findOne({
      emailDomain: emailDomain(email),
      isActive: true,
    });
    if (!university) {
      return res.status(400).json({ error: 'Email domain is not from an approved university' });
    }

    if (await User.exists({ email })) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const code = gen6();
    const user = await User.create({
      name,
      username,
      email,
      passwordHash: await bcrypt.hash(password, COST),
      university: university._id,
      paymentHandle: String(req.body.paymentHandle || ''),
      pickupAddress: String(req.body.pickupAddress || ''),
      verificationCodeHash: sha256(code),
      verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const response = { user: user.toPublic(), message: 'Account created. Verify your email to continue.' };
    if (env.DEV_MODE) response.devVerificationCode = code; // dev-only, no real email
    res.status(201).json(response);
  } catch (e) {
    next(e);
  }
}

// POST /api/auth/verify-email { email, code }
async function verifyEmail(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '');
    const user = await User.findOne({ email }).select('+verificationCodeHash');
    if (
      !user ||
      user.emailVerified ||
      !user.verificationExpiresAt ||
      user.verificationExpiresAt < new Date() ||
      !safeEqualHex(user.verificationCodeHash, sha256(code))
    ) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    user.emailVerified = true;
    user.verificationCodeHash = undefined;
    user.verificationExpiresAt = undefined;
    await user.save();
    res.json({ accessToken: signAccessToken(user), user: user.toPublic() });
  } catch (e) {
    next(e);
  }
}

// POST /api/auth/login { email, password }
async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.passwordHash));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });
    if (!user.emailVerified && user.role !== 'admin') {
      return res.status(403).json({ error: 'Please verify your email first', needsVerification: true });
    }
    res.json({ accessToken: signAccessToken(user), user: user.toPublic() });
  } catch (e) {
    next(e);
  }
}

// POST /api/auth/logout — stateless JWT; client discards the token.
async function logout(req, res) {
  res.json({ message: 'Logged out' });
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user.toPublic() });
}

// POST /api/auth/forgot-password { email }
async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    const response = { message: 'If the account exists, reset instructions were generated.' };
    if (user) {
      const raw = crypto.randomBytes(32).toString('base64url');
      user.resetTokenHash = sha256(raw);
      user.resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      if (env.DEV_MODE) response.devResetToken = raw; // dev-only, no real email
    }
    res.json(response);
  } catch (e) {
    next(e);
  }
}

// POST /api/auth/reset-password { email, token, newPassword }
async function resetPassword(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const token = String(req.body.token || '');
    const password = String(req.body.newPassword || '');
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be 8–72 characters' });
    }
    const user = await User.findOne({ email }).select('+resetTokenHash');
    if (
      !user ||
      !user.resetTokenHash ||
      !user.resetExpiresAt ||
      user.resetExpiresAt < new Date() ||
      !safeEqualHex(user.resetTokenHash, sha256(token))
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    user.passwordHash = await bcrypt.hash(password, COST);
    user.passwordChangedAt = new Date();
    user.resetTokenHash = undefined;
    user.resetExpiresAt = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (e) {
    next(e);
  }
}

module.exports = { register, verifyEmail, login, logout, me, forgotPassword, resetPassword };
