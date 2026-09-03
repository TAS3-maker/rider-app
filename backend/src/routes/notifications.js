// Notification routes. List/read is functional; broadcast is admin-only (later phase).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Notification } = require('../models');
const { cleanList } = require('../config/serialize');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ data: cleanList(items) });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { read: true } });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
