const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { TravelEvent, Ride } = require('../models');
const { ROLES } = require('../config/constants');
const { clean } = require('../config/serialize');

const HIGH_DEMAND = 5;

async function withDemand(ev) {
  const end = ev.endDate || ev.startDate;
  const demand = await Ride.countDocuments({
    travelDate: { $gte: new Date(ev.startDate), $lte: new Date(end) },
    status: { $ne: 'cancelled' },
  });
  return { ...clean(ev), demandCount: demand, highDemand: demand >= HIGH_DEMAND };
}

// Public paginated list of visible upcoming events with live demand counts.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = { visible: true };
    const [items, total] = await Promise.all([
      TravelEvent.find(filter).sort({ startDate: 1 }).skip(skip).limit(limit).lean(),
      TravelEvent.countDocuments(filter),
    ]);
    const data = await Promise.all(items.map(withDemand));
    res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});

// ---- Admin CRUD ----
router.post('/', requireAuth, requireRole(ROLES.ADMIN), async (req, res, next) => {
  try {
    const { title, description, startDate, endDate, type, visible } = req.body || {};
    if (!title || !startDate) return res.status(400).json({ error: 'title and startDate are required' });
    const ev = await TravelEvent.create({ title, description, startDate, endDate, type, visible });
    res.status(201).json({ data: clean(ev.toObject()) });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireAuth, requireRole(ROLES.ADMIN), async (req, res, next) => {
  try {
    const ev = await TravelEvent.findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true }).lean();
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    res.json({ data: clean(ev) });
  } catch (e) {
    next(e);
  }
});

// Soft delete (hide) — never destroy data in place.
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), async (req, res, next) => {
  try {
    await TravelEvent.updateOne({ _id: req.params.id }, { $set: { visible: false } });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
