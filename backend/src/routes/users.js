// Users & profile routes. Profile update is functional; the rest are Phase 0 stubs.
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { User } = require('../models');

const EDITABLE = [
  'name',
  'username',
  'profileImage',
  'phone',
  'pickupPreferences',
  'pickupAddress',
  'luggageInfo',
  'paymentHandle',
];

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toPublic() }));

// PATCH /api/users/me — update permitted profile fields
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const updates = {};
    for (const key of EDITABLE) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ user: user.toPublic() });
  } catch (e) {
    next(e);
  }
}); 

// GET /api/users/:id — public profile
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toPublic() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
