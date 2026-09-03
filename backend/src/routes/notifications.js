const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Notification } = require('../models');
const { serialize } = require('../services/notificationService');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = { user: req.user._id };
    const [items, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);
    res.json({ data: items.map(serialize), page, limit, total, totalPages: Math.ceil(total / limit), unread });
  } catch (e) {
    next(e);
  }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ unread });
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

router.post('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
