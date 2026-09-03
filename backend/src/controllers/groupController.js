const { RideGroup, Ride, GroupMember } = require('../models');
const { GROUP_STATUS, GROUP_TYPE, ROLES } = require('../config/constants');
const groupService = require('../services/groupService');

function getPage(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

// Browse Rides — paginated public groups for the user's university.
async function browse(req, res, next) {
  try {
    const { page, limit, skip } = getPage(req);
    const filter = {
      university: req.user.university,
      type: GROUP_TYPE.PUBLIC,
      status: { $in: [GROUP_STATUS.OPEN, GROUP_STATUS.NEARLY_FULL, GROUP_STATUS.FULL] },
    };
    if (req.query.direction) filter.direction = req.query.direction;
    if (req.query.airport) filter.airport = req.query.airport;
    if (req.query.date) {
      const d = new Date(req.query.date);
      d.setUTCHours(0, 0, 0, 0);
      const e = new Date(d);
      e.setUTCDate(e.getUTCDate() + 1);
      filter.travelDate = { $gte: d, $lt: e };
    }
    const [groups, total] = await Promise.all([
      RideGroup.find(filter).sort({ travelDate: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      RideGroup.countDocuments(filter),
    ]);
    const data = await Promise.all(groups.map((g) => groupService.serializeGroup(g._id, req.user._id)));
    res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
}

async function getGroup(req, res, next) {
  try {
    const view = await groupService.serializeGroup(req.params.id, req.user._id);
    if (!view) return res.status(404).json({ error: 'Group not found' });
    res.json({ data: view });
  } catch (e) {
    next(e);
  }
}

// Create a brand-new group from the caller's ride (used when no match is chosen).
async function create(req, res, next) {
  try {
    const ride = await Ride.findOne({ _id: req.body.rideId, student: req.user._id });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.group) return res.status(409).json({ error: 'Ride is already in a group' });
    const group = await groupService.createGroupFromRide(ride, { isPrivate: !!req.body.isPrivate, actorId: req.user._id });
    const view = await groupService.serializeGroup(group._id, req.user._id);
    res.status(201).json({ data: view });
  } catch (e) {
    next(e);
  }
}

async function join(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const ride = await Ride.findOne({ _id: req.body.rideId, student: req.user._id });
    if (!ride) return res.status(404).json({ error: 'Your ride was not found' });
    if (ride.group) return res.status(409).json({ error: 'Your ride is already in a group' });
    if (String(ride.university) !== String(group.university) || ride.direction !== group.direction || String(ride.airport) !== String(group.airport)) {
      return res.status(400).json({ error: 'Ride is not compatible with this group' });
    }
    await groupService.joinGroup(group, ride, req.user._id);
    const view = await groupService.serializeGroup(group._id, req.user._id);
    res.json({ data: view });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

async function leave(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await groupService.leaveGroup(group, req.user._id);
    res.json({ data: { left: true } });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

async function setBooker(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const targetId = req.body.userId || String(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isCurrentBooker = String(group.bookerId) === String(req.user._id);
    // If the seat is vacant, any active member may accept it (for themselves).
    const acceptingVacant = group.noBookerFlag && String(targetId) === String(req.user._id);
    if (!isAdmin && !isCurrentBooker && !acceptingVacant) {
      return res.status(403).json({ error: 'Only the current booker can transfer the role' });
    }
    const view = await groupService.assignBooker(group, targetId, req.user._id).then(() => groupService.serializeGroup(group._id, req.user._id));
    res.json({ data: view });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

function bookerOnly(group, req, res) {
  if (req.user.role !== ROLES.ADMIN && String(group.bookerId) !== String(req.user._id)) {
    res.status(403).json({ error: 'Only the booker can do this' });
    return false;
  }
  return true;
}

async function book(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!bookerOnly(group, req, res)) return;
    await groupService.bookGroup(group, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

async function complete(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!bookerOnly(group, req, res)) return;
    await groupService.completeGroup(group, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    next(e);
  }
}

async function cancel(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!bookerOnly(group, req, res)) return;
    await groupService.cancelGroup(group, req.body?.reason || 'Cancelled by booker', req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    next(e);
  }
}

async function cabCancelled(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!bookerOnly(group, req, res)) return;
    await groupService.markCabCancelled(group, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    next(e);
  }
}

module.exports = { browse, getGroup, create, join, leave, setBooker, book, complete, cancel, cabCancelled };
