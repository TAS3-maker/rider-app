const { Ride, RideGroup, GroupMember, FareRecord, User } = require('../models');
const { RIDE_STATUS, RIDE_DIRECTION, GROUP_STATUS, EVENT_LOG_TYPE, NOTIFICATION_TYPE } = require('../config/constants');
const groupService = require('../services/groupService');
const matchingEngine = require('../services/matchingEngine');
const notificationService = require('../services/notificationService');
const { round2 } = require('../services/fareService');

function getPage(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

async function lightGroup(g) {
  const members = await GroupMember.find({ group: g._id, isActive: true }).populate('user', 'name').lean();
  const perPerson = g.memberCount ? round2(g.estimatedTotalFare / g.memberCount) : 0;
  const solo = g.soloFareEstimate || 57;
  return {
    id: g._id,
    status: g.status,
    direction: g.direction,
    capacity: g.capacity,
    memberCount: g.memberCount,
    travelDate: g.travelDate,
    flightWindowStart: g.flightWindowStart,
    flightWindowEnd: g.flightWindowEnd,
    suggestedDeparture: g.suggestedDeparture,
    bookingDeadline: g.bookingDeadline,
    vehicleSuggestion: g.vehicleSuggestion,
    totalBags: g.totalBags,
    perPerson,
    savingsPct: solo ? Math.max(0, Math.round((1 - perPerson / solo) * 100)) : 0,
    members: members.map((m) => ({
      userId: m.user && m.user._id,
      name: m.user && m.user.name,
      initials: groupService.initials(m.user && m.user.name),
      isBooker: String(g.bookerId) === String(m.user && m.user._id),
    })),
  };
}

async function createRide(req, res, next) {
  try {
    const b = req.body || {};
    if (!b.direction || !Object.values(RIDE_DIRECTION).includes(b.direction))
      return res.status(400).json({ error: 'Valid direction is required' });
    const isCustom = b.destinationType === 'custom';
    if (!isCustom && !b.airport) return res.status(400).json({ error: 'airport is required' });
    if (!b.travelDate) return res.status(400).json({ error: 'travelDate is required' });
    if (!b.flightTime) return res.status(400).json({ error: 'flightTime is required' });

    const ride = await Ride.create({
      student: req.user._id,
      university: req.user.university,
      direction: b.direction,
      airport: isCustom ? undefined : b.airport,
      destination: b.destination || undefined,
      destinationType: isCustom ? 'custom' : 'airport',
      customDestinationName: isCustom ? (b.customDestinationName || '') : '',
      terminal: b.direction === RIDE_DIRECTION.AIRPORT_TO_UNIVERSITY && b.terminal ? b.terminal : undefined,
      travelDate: new Date(b.travelDate),
      flightTime: new Date(b.flightTime),
      flightInfo: b.flightInfo || '',
      pickupLocation: b.pickupLocation || '',
      passengerCount: b.passengerCount || 1,
      checkedBags: b.checkedBags != null ? b.checkedBags : 0,
      luggageInfo: b.luggageInfo || '',
      flexible: !!b.flexible,
      flexibleTiming: !!(b.flexibleTiming ?? b.flexible),
      notes: b.notes || '',
      status: RIDE_STATUS.OPEN,
    });
    await groupService.logEvent(EVENT_LOG_TYPE.RIDE_CREATED, { actor: req.user._id, ride: ride._id, message: 'Ride created' });

    const isPrivate = b.mode === 'private';
    if (isPrivate) {
      const group = await groupService.createGroupFromRide(ride, { isPrivate: true, actorId: req.user._id });
      const view = await groupService.serializeGroup(group._id, req.user._id);
      return res.status(201).json({ ride: { id: ride._id }, group: view, inviteCode: group.inviteCode, mode: 'private' });
    }

    // Public: present ranked candidate groups (Browse Rides shows these).
    const candidates = await matchingEngine.findCompatibleGroups(ride);
    const groups = await Promise.all(candidates.map((c) => lightGroup(c.group)));
    return res.status(201).json({ ride: { id: ride._id }, candidates: groups, matchCount: groups.length, mode: 'public' });
  } catch (e) {
    next(e);
  }
}

async function getRideMatches(req, res, next) {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, student: req.user._id });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    const candidates = await matchingEngine.findCompatibleGroups(ride);
    const groups = await Promise.all(candidates.map((c) => lightGroup(c.group)));
    res.json({ data: groups, total: groups.length, rideId: ride._id });
  } catch (e) {
    next(e);
  }
}

async function getRide(req, res, next) {
  try {
    const ride = await Ride.findById(req.params.id).populate('airport', 'code name').lean();
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json({ data: { ...ride, id: ride._id, _id: undefined } });
  } catch (e) {
    next(e);
  }
}

async function updateRide(req, res, next) {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, student: req.user._id });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    const b = req.body || {};
    const flightChanged = b.flightTime && new Date(b.flightTime).getTime() !== new Date(ride.flightTime).getTime();
    const pickupChanged = b.pickupLocation != null && b.pickupLocation !== ride.pickupLocation;
    if (b.flightTime) ride.flightTime = new Date(b.flightTime);
    if (b.pickupLocation != null) ride.pickupLocation = b.pickupLocation;
    if (b.flightInfo != null) ride.flightInfo = b.flightInfo;
    if (b.checkedBags != null) ride.checkedBags = b.checkedBags;
    if (b.notes != null) ride.notes = b.notes;
    await ride.save();
    await groupService.logEvent(EVENT_LOG_TYPE.RIDE_UPDATED, { actor: req.user._id, ride: ride._id, message: 'Ride updated' });

    // Flight/pickup change while grouped → trigger re-match check.
    if ((flightChanged || pickupChanged) && ride.group) {
      const group = await RideGroup.findById(ride.group);
      if (group && ![GROUP_STATUS.CANCELLED, GROUP_STATUS.COMPLETED].includes(group.status)) {
        group.rematchNeeded = true;
        await group.save();
        await groupService.recomputeGroup(group._id);
        await groupService.logEvent(EVENT_LOG_TYPE.REMATCH_FLAGGED, { actor: req.user._id, ride: ride._id, group: group._id, message: 'Flight/pickup changed' });
        await notificationService.notify(group.bookerId, {
          type: NOTIFICATION_TYPE.REMATCH_NEEDED,
          title: 'Group needs review',
          body: 'A rider changed their flight or pickup. Re-check the plan.',
          data: { groupId: group._id },
        });
      }
    }
    res.json({ data: { id: ride._id } });
  } catch (e) {
    next(e);
  }
}

async function cancelRide(req, res, next) {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, student: req.user._id });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.group) {
      const group = await RideGroup.findById(ride.group);
      if (group) await groupService.leaveGroup(group, req.user._id);
    }
    ride.status = RIDE_STATUS.CANCELLED;
    ride.cancelReason = req.body?.reason || 'Cancelled by rider';
    await ride.save();
    await groupService.logEvent(EVENT_LOG_TYPE.RIDE_CANCELLED, { actor: req.user._id, ride: ride._id, message: ride.cancelReason });
    res.json({ data: { id: ride._id, status: ride.status } });
  } catch (e) {
    next(e);
  }
}

// Paginated participation history + summary (total rides + total saved).
async function history(req, res, next) {
  try {
    const { page, limit, skip } = getPage(req);
    const filter = { user: req.user._id };
    const [memberships, total] = await Promise.all([
      GroupMember.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'group', populate: { path: 'airport', select: 'code name' } })
        .populate('ride', 'flightTime checkedBags direction travelDate')
        .lean(),
      GroupMember.countDocuments(filter),
    ]);

    const items = [];
    for (const m of memberships) {
      const g = m.group;
      if (!g) continue;
      const fare = await FareRecord.findOne({ group: g._id }).lean();
      const share = fare && (fare.shares || []).find((s) => String(s.user) === String(req.user._id));
      const others = await GroupMember.find({ group: g._id }).populate('user', 'name').lean();
      const solo = g.soloFareEstimate || 57;
      const yourShare = share ? share.amount : null;
      const saved = yourShare != null ? round2(solo - yourShare) : null;
      items.push({
        id: g._id,
        direction: g.direction,
        airport: g.airport ? { code: g.airport.code, name: g.airport.name } : null,
        travelDate: g.travelDate,
        status: g.status,
        cancelled: g.status === GROUP_STATUS.CANCELLED,
        cancelReason: g.cancelReason || '',
        riders: others.map((o) => ({ name: o.user && o.user.name, isBooker: String(g.bookerId) === String(o.user && o.user._id) })),
        totalFare: fare ? fare.totalCost : null,
        yourShare,
        yourPercent: share ? share.percent : null,
        saved,
        paymentConfirmed: share ? share.paymentConfirmed : m.paymentConfirmed,
        isBooker: String(g.bookerId) === String(req.user._id),
      });
    }

    // Summary over the full set (not just this page).
    const allMemberships = await GroupMember.find(filter).populate('group', 'status soloFareEstimate').lean();
    let completedCount = 0;
    let totalSaved = 0;
    for (const m of allMemberships) {
      if (m.group && m.group.status === GROUP_STATUS.COMPLETED) {
        completedCount += 1;
        const fare = await FareRecord.findOne({ group: m.group._id }).lean();
        const share = fare && (fare.shares || []).find((s) => String(s.user) === String(req.user._id));
        const solo = m.group.soloFareEstimate || 57;
        if (share) totalSaved += round2(solo - share.amount);
      }
    }

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary: { completedRides: completedCount, totalSaved: round2(totalSaved) },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { createRide, getRideMatches, getRide, updateRide, cancelRide, history };
