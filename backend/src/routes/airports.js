// Airport reference data. Public list; admin-managed writes come in a later phase.
const router = require('express').Router();
const { Airport } = require('../models');
const { cleanList } = require('../config/serialize');

router.get('/', async (req, res, next) => {
  try {
    const airports = await Airport.find({ isActive: true }).sort({ code: 1 }).lean();
    res.json({ data: cleanList(airports) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
