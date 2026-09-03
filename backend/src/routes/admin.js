const router = require('express').Router();
const { adminAuth } = require('../middleware/adminAuth');
const {
  User,
  University,
  Airport,
  Destination,
  Ride,
  RideGroup,
  GroupMember,
  FareRecord,
  Notification,
  TravelEvent,
  PlatformSetting,
  EventLog,
} = require('../models');
const { mongoose } = require('../config/db');
const groupService = require('../services/groupService');

router.use(...adminAuth);

// ---------- helpers ----------
const PRETTY = {
  open: 'Open', nearly_full: 'Nearly Full', full: 'Full', matched: 'Matched',
  grouped: 'Grouped', confirmed: 'Confirmed', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled', draft: 'Draft',
};
const pretty = (s) => PRETTY[s] || s || '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const fmtDT = (d) => (d ? `${new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : '');
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '');
const shortDay = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
const initials = (name) => (name || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const page = (req) => Math.max(1, parseInt(req.query.page, 10) || 1);
const limit = (req) => Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

const DEFAULT_SETTINGS = {
  platformName: 'RidePact',
  supportEmail: 'support@ridepact.com',
  maxGroupSize: 4,
  maxRidersPerGroup: 4,
  matchingTimeWindowMinutes: 120,
  flightTimeWindowMinutes: 120,
  bookingDeadlineBufferMinutes: 120,
  airportArrivalBufferMinutes: 165,
  airportBufferMinutes: 165,
  bookerDiscountAmount: 0,
  bookerDiscount2Riders: 0,
  bookerDiscount3Riders: 0,
  bookerDiscount4Riders: 0,
  notificationTriggers: {
    break14d: true, break3d: true, riderAdded: true, groupFull: true,
    flightReminder3h: true, reimbursement2h: true,
  },
  termsOfServiceUrl: 'https://ridepact.com/terms',
  privacyPolicyUrl: 'https://ridepact.com/privacy',
};

async function uniName(id, cache) {
  if (!id) return '';
  const k = String(id);
  if (cache && cache[k]) return cache[k];
  const u = await University.findById(id).select('name shortName').lean();
  const name = u ? (u.shortName || u.name) : '';
  if (cache) cache[k] = name;
  return name;
}

// ---------- dashboard ----------
router.get('/dashboard', async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalRides, completedRides, cancelledRides, activeGroups, upcomingEvents] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      Ride.countDocuments({}),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'cancelled' }),
      RideGroup.countDocuments({ status: { $in: ['open', 'nearly_full', 'full', 'confirmed', 'in_progress'] } }),
      TravelEvent.countDocuments({ visible: true, endDate: { $gte: new Date() } }),
    ]);
    const activeTrips = await Ride.countDocuments({ status: { $nin: ['completed', 'cancelled', 'draft'] } });
    const [relAgg, memberAgg] = await Promise.all([
      User.aggregate([{ $match: { role: 'student' } }, { $group: { _id: null, avg: { $avg: '$reliabilityScore' } } }]),
      GroupMember.countDocuments({ isActive: true }),
    ]);
    const avgReliability = relAgg[0] ? Math.round((relAgg[0].avg || 0) * 10) / 10 : 5;
    const avgRidersPerGroup = activeGroups ? Math.round((memberAgg / activeGroups) * 10) / 10 : 0;
    res.json({
      totalUsers, activeStudents: activeUsers, activeUsers,
      totalRides, activeTrips, completedRides, cancelledRides,
      activeGroups, upcomingEvents,
      avgRidersPerGroup, avgSavingsPerRider: 0, avgReliability,
      matchToCompleteRate: totalRides ? Math.round((completedRides / totalRides) * 100) + '%' : '—',
      paymentConfirmedRate: '—',
      totalUsersChange: '', activeTripsChange: '', completedRidesChange: '',
    });
  } catch (e) { next(e); }
});

// ---------- users ----------
router.get('/users', async (req, res, next) => {
  try {
    const q = { role: 'student' };
    if (req.query.status && req.query.status !== 'all') q.isActive = req.query.status === 'active';
    if (req.query.verification && req.query.verification !== 'all') q.emailVerified = req.query.verification === 'verified';
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).trim(), 'i');
      q.$or = [{ name: rx }, { email: rx }, { paymentHandle: rx }, { username: rx }];
    }
    const users = await User.find(q).sort({ createdAt: -1 }).skip((page(req) - 1) * limit(req)).limit(limit(req)).lean();
    const counts = await Ride.aggregate([
      { $group: { _id: '$student', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } } } },
    ]);
    const cmap = {};
    counts.forEach((c) => { cmap[String(c._id)] = c; });
    const cache = {};
    const data = [];
    for (const u of users) {
      const c = cmap[String(u._id)] || {};
      data.push({
        id: String(u._id), name: u.name || u.username || u.email, email: u.email,
        school: await uniName(u.university, cache), schoolId: u.university ? String(u.university) : '',
        phone: u.phone || '', paymentHandle: u.paymentHandle || '', venmoHandle: u.paymentHandle || '',
        ridesCount: c.total || 0, completedRidesCount: c.completed || 0, cancelledRidesCount: c.cancelled || 0,
        reliabilityRating: u.reliabilityScore ?? 5, punctualityRating: u.reliabilityScore ?? 5,
        status: u.isActive ? 'active' : 'inactive',
        verificationStatus: u.emailVerified ? 'verified' : 'pending',
        joinedDate: fmtDate(u.createdAt), avatarUrl: u.profileImage || '',
        pickupPreference: u.pickupPreferences || '', luggagePreference: u.luggageInfo || '', notes: '',
      });
    }
    res.json({ data, page: page(req), limit: limit(req), total: await User.countDocuments(q) });
  } catch (e) { next(e); }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const u = await User.findById(req.params.id).lean();
    if (!u) return res.status(404).json({ error: 'User not found' });
    const [total, completed, cancelled] = await Promise.all([
      Ride.countDocuments({ student: u._id }),
      Ride.countDocuments({ student: u._id, status: 'completed' }),
      Ride.countDocuments({ student: u._id, status: 'cancelled' }),
    ]);
    res.json({
      id: String(u._id), name: u.name || u.username || u.email, email: u.email,
      school: await uniName(u.university), phone: u.phone || '', paymentHandle: u.paymentHandle || '',
      ridesCount: total, completedRidesCount: completed, cancelledRidesCount: cancelled,
      reliabilityRating: u.reliabilityScore ?? 5, punctualityRating: u.reliabilityScore ?? 5,
      status: u.isActive ? 'active' : 'inactive', verificationStatus: u.emailVerified ? 'verified' : 'pending',
      joinedDate: fmtDate(u.createdAt), pickupPreference: u.pickupPreferences || '', luggagePreference: u.luggageInfo || '', notes: '',
    });
  } catch (e) { next(e); }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const isActive = req.body.status === 'active';
    const u = await User.findByIdAndUpdate(req.params.id, { $set: { isActive } }, { new: true }).lean();
    if (!u) return res.status(404).json({ error: 'User not found' });
    await EventLog.create({ type: 'ride_status_changed', actor: req.user._id, message: `Admin ${isActive ? 'activated' : 'deactivated'} ${u.name || u.email}`, meta: { userId: String(u._id) } });
    res.json({ id: String(u._id), status: u.isActive ? 'active' : 'inactive' });
  } catch (e) { next(e); }
});

router.get('/users/:id/rides', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const rides = await Ride.find({ student: req.params.id }).populate('airport', 'code name').sort({ createdAt: -1 }).limit(limit(req)).lean();
    res.json({ data: rides.map((r) => ({
      id: '#' + String(r._id).slice(-4).toUpperCase(),
      route: r.direction === 'airport_to_university' ? `${r.airport?.code || 'AIR'} → Campus` : `Campus → ${r.airport?.code || 'AIR'}`,
      date: fmtDate(r.travelDate), flightTime: fmtTime(r.flightTime), status: pretty(r.status),
      fareEstimate: r.estimatedTotalFare || 0, groupId: r.group ? '#' + String(r.group).slice(-4).toUpperCase() : '',
    })) });
  } catch (e) { next(e); }
});

// ---------- trips (rides) ----------
router.get('/trips', async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status && !['all', 'All statuses'].includes(req.query.status)) q.status = String(req.query.status).toLowerCase().replace(/ /g, '_');
    if (req.query.direction && !['all', 'All directions'].includes(req.query.direction)) {
      q.direction = String(req.query.direction).includes('campus') && String(req.query.direction).indexOf('campus') === 0 ? 'university_to_airport' : req.query.direction;
    }
    const rides = await Ride.find(q).populate('student', 'name email').populate('airport', 'code name').populate('university', 'name shortName').sort({ createdAt: -1 }).skip((page(req) - 1) * limit(req)).limit(limit(req)).lean();
    let data = rides.map((r) => ({
      id: '#' + String(r._id).slice(-6).toUpperCase(), _id: String(r._id),
      route: r.direction === 'airport_to_university' ? `${r.airport?.code || 'AIR'} → Campus` : `Campus → ${r.airport?.code || 'AIR'}`,
      school: r.university?.shortName || r.university?.name || '', destination: r.airport?.name || '', airportCode: r.airport?.code || '',
      direction: r.direction === 'airport_to_university' ? 'to_campus' : 'to_airport',
      date: fmtDate(r.travelDate), flightTime: fmtTime(r.flightTime), flightNumber: r.flightInfo || '',
      pickupLocation: r.pickupLocation || '', ridersCount: 1, maxCapacity: 4, status: pretty(r.status),
      bookerName: r.student?.name || '', bookerId: r.student ? String(r.student._id) : '',
      groupId: r.group ? '#' + String(r.group).slice(-6).toUpperCase() : '', fareEstimate: r.estimatedTotalFare || 0,
      luggageInfo: r.luggageInfo || (r.checkedBags != null ? `${r.checkedBags} checked bag(s)` : ''), notes: r.notes || '',
    }));
    if (req.query.search) {
      const s = String(req.query.search).toLowerCase();
      data = data.filter((t) => t.id.toLowerCase().includes(s) || t.route.toLowerCase().includes(s) || t.bookerName.toLowerCase().includes(s));
    }
    res.json({ data, page: page(req), limit: limit(req), total: await Ride.countDocuments(q) });
  } catch (e) { next(e); }
});

router.get('/trips/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id).replace(/^#/, '');
    const ride = mongoose.isValidObjectId(id)
      ? await Ride.findById(id).populate('student', 'name email').populate('airport', 'code name').lean()
      : null;
    if (!ride) return res.status(404).json({ error: 'Trip not found' });
    res.json({
      id: '#' + String(ride._id).slice(-6).toUpperCase(),
      route: ride.direction === 'airport_to_university' ? `${ride.airport?.code || 'AIR'} → Campus` : `Campus → ${ride.airport?.code || 'AIR'}`,
      date: fmtDate(ride.travelDate), flightTime: fmtTime(ride.flightTime), flightNumber: ride.flightInfo || '',
      pickupLocation: ride.pickupLocation || '', status: pretty(ride.status), bookerName: ride.student?.name || '',
      fareEstimate: ride.estimatedTotalFare || 0, luggageInfo: ride.luggageInfo || '', notes: ride.notes || '',
      groupId: ride.group ? '#' + String(ride.group).slice(-6).toUpperCase() : '',
    });
  } catch (e) { next(e); }
});

// ---------- groups ----------
async function mapGroup(g) {
  const members = await GroupMember.find({ group: g._id, isActive: true }).populate('user', 'name email paymentHandle reliabilityScore').lean();
  const fare = g.fareRecord ? await FareRecord.findById(g.fareRecord).lean() : null;
  const shareOf = (uid) => (fare && fare.shares || []).find((s) => String(s.user) === String(uid));
  return {
    id: '#' + String(g._id).slice(-6).toUpperCase(), _id: String(g._id),
    tripId: (g.rides && g.rides[0]) ? '#' + String(g.rides[0]).slice(-6).toUpperCase() : '',
    type: g.isPrivate ? 'Private' : 'Public', status: pretty(g.status),
    capacity: g.capacity || 4, memberCount: members.length, vehicleCapacity: g.vehicleCapacity || 4,
    bookerName: (members.find((m) => String(m.user?._id) === String(g.bookerId)) || {}).user?.name || '',
    pickupMode: g.pickupMode || 'meet_point',
    flags: {
      delayed: !!g.delayed, bookingInfoMissing: !!g.bookingInfoMissing, rematchNeeded: !!g.rematchNeeded,
      adminFlag: !!g.adminFlag, noBookerFlag: !!g.noBookerFlag, cabCancelled: !!g.cabCancelled,
    },
    riders: members.map((m) => {
      const sh = shareOf(m.user?._id);
      return {
        userId: String(m.user?._id), name: m.user?.name || '', email: m.user?.email || '',
        paymentHandle: m.user?.paymentHandle || '', initials: initials(m.user?.name),
        isBooker: String(m.user?._id) === String(g.bookerId),
        paymentStatus: sh ? (sh.paymentConfirmed ? 'confirmed' : 'pending') : 'pending',
        shareAmount: sh ? sh.amount : null, reliability: m.user?.reliabilityScore ?? 5,
        joinedAt: m.joinedAt,
      };
    }),
  };
}

router.get('/groups', async (req, res, next) => {
  try {
    const q = {};
    if (req.query.type && req.query.type !== 'all') q.isPrivate = String(req.query.type).toLowerCase() === 'private';
    if (req.query.status && req.query.status !== 'all') q.status = String(req.query.status).toLowerCase().replace(/ /g, '_');
    const groups = await RideGroup.find(q).sort({ createdAt: -1 }).skip((page(req) - 1) * limit(req)).limit(limit(req)).lean();
    const data = [];
    for (const g of groups) data.push(await mapGroup(g));
    res.json({ data, page: page(req), limit: limit(req), total: await RideGroup.countDocuments(q) });
  } catch (e) { next(e); }
});

router.get('/groups/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id).replace(/^#/, '');
    const g = mongoose.isValidObjectId(id) ? await RideGroup.findById(id).lean() : null;
    if (!g) return res.status(404).json({ error: 'Group not found' });
    res.json(await mapGroup(g));
  } catch (e) { next(e); }
});

// ---------- event logs ----------
router.get('/events', async (req, res, next) => {
  try {
    const q = {};
    if (req.query.eventType && !['all', 'All events'].includes(req.query.eventType)) q.type = req.query.eventType;
    if (req.query.from || req.query.to) {
      q.createdAt = {};
      if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
    }
    const logs = await EventLog.find(q).populate('actor', 'name').sort({ createdAt: -1 }).skip((page(req) - 1) * limit(req)).limit(limit(req)).lean();
    let data = logs.map((l) => ({
      id: String(l._id), timestamp: fmtDT(l.createdAt), eventType: l.type, user: l.actor?.name || 'System',
      userId: l.actor ? String(l.actor._id) : '', tripId: l.ride ? '#' + String(l.ride).slice(-6).toUpperCase() : '',
      groupId: l.group ? '#' + String(l.group).slice(-6).toUpperCase() : '', details: l.message || '',
      source: (l.meta && l.meta.source) || 'system', metadata: l.meta || {},
    }));
    if (req.query.search) {
      const s = String(req.query.search).toLowerCase();
      data = data.filter((e) => (e.details || '').toLowerCase().includes(s) || (e.user || '').toLowerCase().includes(s));
    }
    res.json({ data, page: page(req), limit: limit(req), total: await EventLog.countDocuments(q) });
  } catch (e) { next(e); }
});

// ---------- schools (universities) ----------
const mapSchool = async (s) => ({
  id: String(s._id), name: s.name, shortName: s.shortName || s.name, domain: s.emailDomain,
  usersCount: await User.countDocuments({ university: s._id, role: 'student' }),
  ridesCount: await Ride.countDocuments({ university: s._id }),
  status: s.isActive ? 'Live' : 'Paused', destinations: [], soloFareEstimate: 0,
  address: s.address || '', notes: s.notes || '',
});
router.get('/schools', async (req, res, next) => {
  try {
    const schools = await University.find({}).sort({ name: 1 }).lean();
    const data = [];
    for (const s of schools) data.push(await mapSchool(s));
    res.json({ data });
  } catch (e) { next(e); }
});
router.post('/schools', async (req, res, next) => {
  try {
    const { name, domain, emailDomain, shortName, status } = req.body;
    const s = await University.create({
      name, shortName: shortName || '', emailDomain: String(domain || emailDomain || '').toLowerCase().replace(/^@/, ''),
      isActive: status ? status === 'Live' : true, address: req.body.address || '', notes: req.body.notes || '',
    });
    await EventLog.create({ type: 'ride_status_changed', actor: req.user._id, message: `New school configured: ${name}` });
    res.status(201).json(await mapSchool(s.toObject()));
  } catch (e) { if (e.code === 11000) return res.status(409).json({ error: 'Domain already exists' }); next(e); }
});
router.patch('/schools/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const upd = {};
    if (req.body.name != null) upd.name = req.body.name;
    if (req.body.shortName != null) upd.shortName = req.body.shortName;
    if (req.body.domain != null) upd.emailDomain = String(req.body.domain).toLowerCase().replace(/^@/, '');
    if (req.body.status != null) upd.isActive = req.body.status === 'Live';
    if (req.body.address != null) upd.address = req.body.address;
    const s = await University.findByIdAndUpdate(req.params.id, { $set: upd }, { new: true }).lean();
    if (!s) return res.status(404).json({ error: 'School not found' });
    res.json(await mapSchool(s));
  } catch (e) { next(e); }
});

// ---------- destinations ----------
const mapDest = (d) => ({ id: String(d._id), name: d.name, code: d.code || '', type: d.type || '', address: d.address || '', directions: 'both', status: d.isActive ? 'Active' : 'Inactive' });
router.get('/destinations', async (req, res, next) => {
  try { res.json({ data: (await Destination.find({}).sort({ name: 1 }).lean()).map(mapDest) }); } catch (e) { next(e); }
});
router.post('/destinations', async (req, res, next) => {
  try {
    const d = await Destination.create({ name: req.body.name, type: req.body.type || req.body.area || 'campus', address: req.body.address || '', isActive: req.body.status ? req.body.status === 'Active' : true });
    res.status(201).json(mapDest(d.toObject()));
  } catch (e) { next(e); }
});
router.patch('/destinations/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const upd = {};
    ['name', 'type', 'address'].forEach((k) => { if (req.body[k] != null) upd[k] = req.body[k]; });
    if (req.body.status != null) upd.isActive = req.body.status === 'Active';
    const d = await Destination.findByIdAndUpdate(req.params.id, { $set: upd }, { new: true }).lean();
    if (!d) return res.status(404).json({ error: 'Destination not found' });
    res.json(mapDest(d));
  } catch (e) { next(e); }
});

// ---------- pickups / airports ----------
const mapAirport = (a) => ({ id: String(a._id), name: a.name, code: a.code, area: 'Airport', address: a.city || '', baseFare: a.baseFare, status: a.isActive ? 'Active' : 'Inactive' });
router.get('/pickups', async (req, res, next) => {
  try { res.json({ data: (await Airport.find({}).sort({ code: 1 }).lean()).map(mapAirport) }); } catch (e) { next(e); }
});
router.post('/pickups', async (req, res, next) => {
  try {
    const code = String(req.body.code || req.body.name || '').toUpperCase().slice(0, 4);
    const a = await Airport.create({ code, name: req.body.name, city: req.body.address || req.body.area || '', baseFare: req.body.baseFare || 57, isActive: req.body.status ? req.body.status === 'Active' : true });
    res.status(201).json(mapAirport(a.toObject()));
  } catch (e) { if (e.code === 11000) return res.status(409).json({ error: 'Airport code exists' }); next(e); }
});
router.patch('/pickups/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const upd = {};
    if (req.body.name != null) upd.name = req.body.name;
    if (req.body.address != null) upd.city = req.body.address;
    if (req.body.baseFare != null) upd.baseFare = req.body.baseFare;
    if (req.body.status != null) upd.isActive = req.body.status === 'Active';
    const a = await Airport.findByIdAndUpdate(req.params.id, { $set: upd }, { new: true }).lean();
    if (!a) return res.status(404).json({ error: 'Airport not found' });
    res.json(mapAirport(a));
  } catch (e) { next(e); }
});

// ---------- break calendar (travel events) ----------
async function mapBreak(ev) {
  const demandCount = await Ride.countDocuments({ travelDate: { $gte: ev.startDate, $lte: ev.endDate || ev.startDate } });
  const level = demandCount >= 20 ? 'Very High' : demandCount >= 8 ? 'High' : demandCount >= 3 ? 'Medium' : 'Low';
  return {
    id: String(ev._id), event: ev.title, title: ev.title, description: ev.description || '',
    start: shortDay(ev.startDate), end: shortDay(ev.endDate), startDate: ev.startDate, endDate: ev.endDate,
    demand: level, tripsCount: demandCount, demandCount, visibility: ev.visible, status: ev.visible ? 'Visible' : 'Hidden',
    notification14dSent: !!ev.notification14dSent, notification3dSent: !!ev.notification3dSent,
  };
}
router.get('/events/calendar', async (req, res, next) => {
  try {
    const evs = await TravelEvent.find({}).sort({ startDate: 1 }).lean();
    const data = [];
    for (const ev of evs) data.push(await mapBreak(ev));
    res.json({ data });
  } catch (e) { next(e); }
});
router.post('/events/calendar', async (req, res, next) => {
  try {
    const ev = await TravelEvent.create({
      title: req.body.title || req.body.event, description: req.body.description || '',
      startDate: new Date(req.body.startDate || req.body.start), endDate: new Date(req.body.endDate || req.body.end || req.body.startDate || req.body.start),
      visible: req.body.visibility != null ? !!req.body.visibility : true, type: req.body.type || 'holiday',
    });
    res.status(201).json(await mapBreak(ev.toObject()));
  } catch (e) { next(e); }
});
router.patch('/events/calendar/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const upd = {};
    if (req.body.title != null || req.body.event != null) upd.title = req.body.title || req.body.event;
    if (req.body.description != null) upd.description = req.body.description;
    if (req.body.startDate != null || req.body.start != null) upd.startDate = new Date(req.body.startDate || req.body.start);
    if (req.body.endDate != null || req.body.end != null) upd.endDate = new Date(req.body.endDate || req.body.end);
    if (req.body.visibility != null) upd.visible = !!req.body.visibility;
    const ev = await TravelEvent.findByIdAndUpdate(req.params.id, { $set: upd }, { new: true }).lean();
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    res.json(await mapBreak(ev));
  } catch (e) { next(e); }
});
router.delete('/events/calendar/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    await TravelEvent.updateOne({ _id: req.params.id }, { $set: { visible: false } });
    res.json({ message: 'ok' });
  } catch (e) { next(e); }
});
router.post('/events/calendar/:id/trigger-notification', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const flag = req.body.type === '3d' ? 'notification3dSent' : 'notification14dSent';
    const ev = await TravelEvent.findByIdAndUpdate(req.params.id, { $set: { [flag]: true } }, { new: true }).lean();
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    const students = await User.find({ role: 'student', isActive: true }).select('_id').lean();
    await Notification.insertMany(students.map((s) => ({ user: s._id, type: 'ride_reminder', title: `Travel reminder: ${ev.title} is approaching`, body: `Coordinate shared rides for ${ev.title}.`, data: { eventId: String(ev._id) } })));
    res.json(await mapBreak(ev));
  } catch (e) { next(e); }
});

// ---------- notifications (announcements) ----------
router.get('/notifications/history', async (req, res, next) => {
  try {
    const rows = await Notification.aggregate([
      { $match: { type: 'announcement' } },
      { $group: { _id: { title: '$title', body: '$body' }, delivered: { $sum: 1 }, date: { $max: '$createdAt' } } },
      { $sort: { date: -1 } }, { $limit: 50 },
    ]);
    const total = await User.countDocuments({ role: 'student', isActive: true });
    res.json({ data: rows.map((r) => ({
      id: String(r.date.getTime()), date: fmtDate(r.date), title: r._id.title, message: r._id.body,
      audience: 'All registered students', target: `All (${total})`, deliveredCount: r.delivered,
      totalAudience: total, deliveryRate: '100%', opened: '—', tripsCreated: '—', status: 'Sent',
    })) });
  } catch (e) { next(e); }
});
router.post('/notifications', async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'title and message are required' });
    const filter = { role: 'student', isActive: true };
    if (req.body.schoolId && mongoose.isValidObjectId(req.body.schoolId)) filter.university = req.body.schoolId;
    const students = await User.find(filter).select('_id').lean();
    await Notification.insertMany(students.map((s) => ({ user: s._id, type: 'announcement', title, body: message, data: { audience: req.body.audience || 'all' } })));
    await EventLog.create({ type: 'ride_status_changed', actor: req.user._id, message: `Announcement sent: ${title} (${students.length} students)` });
    res.status(201).json({ id: String(Date.now()), title, message, deliveredCount: students.length, totalAudience: students.length, status: 'Sent', date: fmtDate(new Date()) });
  } catch (e) { next(e); }
});

// ---------- settings ----------
async function getSettings() {
  const doc = await PlatformSetting.findOne({ key: 'admin_settings' }).lean();
  return { ...DEFAULT_SETTINGS, ...(doc ? doc.value : {}), notificationTriggers: { ...DEFAULT_SETTINGS.notificationTriggers, ...((doc && doc.value && doc.value.notificationTriggers) || {}) }, lastUpdated: doc ? doc.updatedAt : null };
}
router.get('/settings', async (req, res, next) => { try { res.json(await getSettings()); } catch (e) { next(e); } });
router.patch('/settings', async (req, res, next) => {
  try {
    const current = await getSettings();
    const merged = { ...current, ...req.body };
    delete merged.lastUpdated;
    await PlatformSetting.updateOne({ key: 'admin_settings' }, { $set: { value: merged, description: 'Admin platform settings' } }, { upsert: true });
    // Keep the matching engine in sync.
    if (merged.matchingTimeWindowMinutes != null) await PlatformSetting.updateOne({ key: 'matchWindowMinutes' }, { $set: { value: merged.matchingTimeWindowMinutes } }, { upsert: true });
    if (merged.maxGroupSize != null) await PlatformSetting.updateOne({ key: 'groupCapacity' }, { $set: { value: merged.maxGroupSize } }, { upsert: true });
    await EventLog.create({ type: 'ride_status_changed', actor: req.user._id, message: 'Platform settings updated' });
    res.json(await getSettings());
  } catch (e) { next(e); }
});
router.post('/settings/reset', async (req, res, next) => {
  try {
    await PlatformSetting.updateOne({ key: 'admin_settings' }, { $set: { value: DEFAULT_SETTINGS } }, { upsert: true });
    res.json({ ...DEFAULT_SETTINGS });
  } catch (e) { next(e); }
});

// ---------- resolution flows (SOW edge cases) ----------
router.get('/resolutions', async (req, res, next) => {
  try {
    const [bookerNeeded, missingInfo, fareGroups] = await Promise.all([
      RideGroup.find({ noBookerFlag: true, status: { $nin: ['cancelled', 'completed'] } }).lean(),
      RideGroup.find({ adminFlag: true, status: { $nin: ['cancelled', 'completed'] } }).lean(),
      RideGroup.find({ fareRecord: { $ne: null } }).select('fareRecord').lean(),
    ]);
    const fareIds = fareGroups.map((g) => g.fareRecord);
    const fares = await FareRecord.find({ _id: { $in: fareIds } }).lean();
    const paymentDisputes = fares.filter((f) => f.paymentDisputed || (f.shares || []).some((s) => s.overdue)).map((f) => ({ id: String(f.group), fareId: String(f._id), disputed: !!f.paymentDisputed, overdueCount: (f.shares || []).filter((s) => s.overdue).length }));
    const fareDisputes = fares.filter((f) => f.fareDisputed || f.fareChanged).map((f) => ({ id: String(f.group), fareId: String(f._id), disputed: !!f.fareDisputed, totalCost: f.totalCost }));
    const map = async (g) => await mapGroup(g);
    res.json({
      bookerNeeded: await Promise.all(bookerNeeded.map(map)),
      missingInfo: await Promise.all(missingInfo.map(map)),
      paymentDisputes, fareDisputes,
    });
  } catch (e) { next(e); }
});
router.post('/resolutions/booker/:groupId/assign', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.groupId)) return res.status(400).json({ error: 'Invalid id' });
    const g = await RideGroup.findById(req.params.groupId);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    await groupService.assignBooker(g, req.body.userId, req.user._id);
    res.json(await mapGroup((await RideGroup.findById(g._id).lean())));
  } catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); next(e); }
});
router.post('/resolutions/:kind/:groupId/resolve', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.groupId)) return res.status(400).json({ error: 'Invalid id' });
    const g = await RideGroup.findById(req.params.groupId);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    if (req.params.kind === 'missing-info') { g.adminFlag = false; g.bookingInfoMissing = false; }
    if (req.params.kind === 'fare' && g.fareRecord) await FareRecord.updateOne({ _id: g.fareRecord }, { $set: { fareChanged: false, fareDisputed: false } });
    if (req.params.kind === 'payment' && g.fareRecord) await FareRecord.updateOne({ _id: g.fareRecord }, { $set: { paymentDisputed: false, 'shares.$[].overdue': false } });
    await g.save();
    await EventLog.create({ type: 'ride_status_changed', actor: req.user._id, group: g._id, message: `Admin resolved ${req.params.kind} for group` });
    res.json({ message: 'resolved' });
  } catch (e) { next(e); }
});

// ---------- legacy stats (kept) ----------
router.get('/health', (req, res) => res.json({ status: 'ok', role: 'admin' }));
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalRides, completedRides, cancelledRides, activeGroups, upcomingEvents] = await Promise.all([
      User.countDocuments({ role: 'student' }), User.countDocuments({ role: 'student', isActive: true }),
      Ride.countDocuments({}), Ride.countDocuments({ status: 'completed' }), Ride.countDocuments({ status: 'cancelled' }),
      RideGroup.countDocuments({ status: { $in: ['open', 'nearly_full', 'full', 'confirmed', 'in_progress'] } }),
      TravelEvent.countDocuments({ visible: true }),
    ]);
    res.json({ totalUsers, activeUsers, totalRides, completedRides, cancelledRides, activeGroups, upcomingEvents });
  } catch (e) { next(e); }
});

module.exports = router;
