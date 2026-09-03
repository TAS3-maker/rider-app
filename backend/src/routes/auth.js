const router = require('express').Router();
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/register', validate(['email', 'password']), auth.register);
router.post('/verify-email', validate(['email', 'code']), auth.verifyEmail);
router.post('/login', validate(['email', 'password']), auth.login);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);
router.post('/forgot-password', validate(['email']), auth.forgotPassword);
router.post('/reset-password', validate(['email', 'token', 'newPassword']), auth.resetPassword);

module.exports = router;
