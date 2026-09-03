// Destination reference data. Public list; admin-managed writes come in a later phase.
const router = require('express').Router();
const { Destination } = require('../models');
const { cleanList } = require('../config/serialize');

router.get('/', async (req, res, next) => {
  try {
    const destinations = await Destination.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({ data: cleanList(destinations) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
