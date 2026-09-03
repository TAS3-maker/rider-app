// University reference data. Public list; admin-managed writes come in a later phase.
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { University } = require('../models');
const { clean, cleanList } = require('../config/serialize');

router.get('/', async (req, res, next) => {
  try {
    const universities = await University.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({ data: cleanList(universities) });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const uni = await University.findById(req.params.id).lean();
    if (!uni) return res.status(404).json({ error: 'University not found' });
    res.json({ data: clean(uni) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
