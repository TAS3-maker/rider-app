// Travel event calendar. Public list of visible events; admin manages events in a later phase.
const router = require('express').Router();
const { TravelEvent } = require('../models');
const { cleanList } = require('../config/serialize');

router.get('/', async (req, res, next) => {
  try {
    const events = await TravelEvent.find({ visible: true }).sort({ startDate: 1 }).lean();
    res.json({ data: cleanList(events) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
