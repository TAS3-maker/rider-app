const { RideGroup, Ride, GroupMember } = require('../models');
const { GROUP_STATUS, GROUP_TYPE, ROLES } = require('../config/constants');
const groupService = require('../services/groupService');
const chatService = require('../services/chatService');

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
    // Bag-count filter (group's aggregated totalBags).
    const minBags = req.query.minBags != null ? parseInt(req.query.minBags, 10) : null;
    const maxBags = req.query.maxBags != null ? parseInt(req.query.maxBags, 10) : null;
    if (minBags != null || maxBags != null) {
      filter.totalBags = {};
      if (minBags != null) filter.totalBags.$gte = minBags;
      if (maxBags != null) filter.totalBags.$lte = maxBags;
    }
    // Flight-time window filter — matches groups whose flight window overlaps the requested hours.
    // timeWindow accepts "morning" | "afternoon" | "evening" or an explicit "HH-HH" (24h) range.
    const WINDOWS = { morning: [5, 12], afternoon: [12, 17], evening: [17, 24] };
    if (req.query.timeWindow) {
      let range = WINDOWS[req.query.timeWindow];
      if (!range && /^\d{1,2}-\d{1,2}$/.test(req.query.timeWindow)) {
        range = req.query.timeWindow.split('-').map((n) => parseInt(n, 10));
      }
      if (range) {
        const [startH, endH] = range;
        const groups0 = await RideGroup.find(filter).select('flightWindowStart flightWindowEnd').lean();
        const okIds = groups0
          .filter((g) => {
            const t = g.flightWindowStart ? new Date(g.flightWindowStart) : null;
            if (!t) return false;
            const h = t.getHours() + t.getMinutes() / 60;
            return h >= startH && h < endH;
          })
          .map((g) => g._id);
        filter._id = { $in: okIds };
      }
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
    await chatService.postSystem(group._id, `${req.user.name || 'A rider'} joined the group`);
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
    await chatService.postSystem(group._id, `${req.user.name || 'A rider'} left the group`);
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
    await chatService.postSystem(group._id, 'Cab booked — check the fare split');
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
    await chatService.postSystem(group._id, 'Ride marked complete');
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

async function start(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!bookerOnly(group, req, res)) return;
    await groupService.startGroup(group, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

async function delay(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!bookerOnly(group, req, res)) return;
    await groupService.markDelayed(group, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    next(e);
  }
}

async function removeRider(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!bookerOnly(group, req, res)) return;
    await groupService.removeRider(group, req.body?.userId, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
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

module.exports = { browse, getGroup, create, join, leave, setBooker, book, complete, cancel, cabCancelled, start, delay, removeRider };
