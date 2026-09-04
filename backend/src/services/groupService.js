const crypto = require('crypto');
const {
  RideGroup,
  Ride,
  GroupMember,
  FareRecord,
  User,
  EventLog,
  Airport,
} = require('../models');
const {
  GROUP_STATUS,
  RIDE_STATUS,
  MEMBER_ROLE,
  GROUP_TYPE,
  NOTIFICATION_TYPE,
  EVENT_LOG_TYPE,
  DEFAULTS,
} = require('../config/constants');
const notificationService = require('./notificationService');
const matchingEngine = require('./matchingEngine');
const { computeShares, round2 } = require('./fareService');

const TERMINAL = [GROUP_STATUS.COMPLETED, GROUP_STATUS.CANCELLED];
const BOOKED = [GROUP_STATUS.CONFIRMED, GROUP_STATUS.IN_PROGRESS, GROUP_STATUS.COMPLETED];

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

async function logEvent(type, { actor, ride, group, message, meta } = {}) {
  try {
    await EventLog.create({ type, actor, ride, group, message: message || '', meta: meta || {} });
  } catch (e) {
    console.error('[eventlog]', e.message);
  }
}

async function notifyMembers(groupId, { type, title, body, data, excludeUserId } = {}) {
  const members = await GroupMember.find({ group: groupId, isActive: true }).lean();
  await Promise.all(
    members
      .filter((m) => !excludeUserId || String(m.user) !== String(excludeUserId))
      .map((m) => notificationService.notify(m.user, { type, title, body, data: { groupId, ...(data || {}) } }))
  );
}

// Recompute derived group fields (times, capacity status, vehicle, fare estimate).
async function recomputeGroup(groupId) {
  const group = await RideGroup.findById(groupId);
  if (!group) return null;
  const members = await GroupMember.find({ group: groupId, isActive: true }).populate('ride').lean();

  const flightTimes = members.map((m) => m.ride && m.ride.flightTime).filter(Boolean);
  const totalBags = members.reduce((s, m) => s + ((m.ride && m.ride.checkedBags) || 0), 0);
  const times = matchingEngine.computeTimes(flightTimes);
  const veh = matchingEngine.vehicleSuggestion(members.length, totalBags);

  group.memberCount = members.length;
  group.totalBags = totalBags;
  group.flightWindowStart = times.earliestFlight;
  group.flightWindowEnd = times.latestFlight;
  if (group.destinationType === 'custom') {
    // Custom destination → manual times, no auto-calculation. The entered flightTime IS the departure.
    group.suggestedDeparture = times.earliestFlight;
    group.bookingDeadline = undefined;
  } else {
    group.suggestedDeparture = times.suggestedDeparture;
    group.bookingDeadline = times.bookingDeadline;
  }
  group.vehicleCapacity = veh.capacity;
  group.vehicleSuggestion = veh.name;

  const airport = group.airport ? await Airport.findById(group.airport).lean() : null;
  group.soloFareEstimate = (airport && airport.baseFare) || DEFAULTS.DEFAULT_SOLO_FARE;
  if (!group.estimatedTotalFare) group.estimatedTotalFare = group.soloFareEstimate;

  // Capacity-driven status (never downgrade a booked/terminal group).
  if (!BOOKED.includes(group.status) && !TERMINAL.includes(group.status)) {
    if (group.memberCount >= group.capacity) group.status = GROUP_STATUS.FULL;
    else if (group.memberCount >= group.capacity - 1) group.status = GROUP_STATUS.NEARLY_FULL;
    else group.status = GROUP_STATUS.OPEN;
  }
  await group.save();
  return group;
}

async function addRider(group, ride, userId, { asBooker = false } = {}) {
  const existing = await GroupMember.findOne({ group: group._id, user: userId, isActive: true });
  if (existing) return existing;
  const member = await GroupMember.create({
    group: group._id,
    user: userId,
    ride: ride._id,
    role: asBooker ? MEMBER_ROLE.BOOKER : MEMBER_ROLE.MEMBER,
  });
  await RideGroup.updateOne(
    { _id: group._id },
    { $addToSet: { members: member._id, rides: ride._id }, ...(asBooker ? { $set: { bookerId: userId } } : {}) }
  );
  await Ride.updateOne({ _id: ride._id }, { $set: { group: group._id, status: RIDE_STATUS.GROUPED } });
  await recomputeGroup(group._id);
  return member;
}

async function createGroupFromRide(ride, { isPrivate = false, actorId } = {}) {
  const group = await RideGroup.create({
    university: ride.university,
    direction: ride.direction,
    airport: ride.airport,
    destination: ride.destination,
    destinationType: ride.destinationType || 'airport',
    customDestinationName: ride.customDestinationName || '',
    travelDate: ride.travelDate,
    type: isPrivate ? GROUP_TYPE.PRIVATE : GROUP_TYPE.PUBLIC,
    inviteCode: isPrivate ? crypto.randomBytes(5).toString('hex') : undefined,
    capacity: DEFAULTS.GROUP_CAPACITY,
    status: GROUP_STATUS.OPEN,
  });
  // Group creator is the initial booker (can be transferred later).
  await addRider(group, ride, ride.student, { asBooker: true });
  await logEvent(EVENT_LOG_TYPE.GROUP_CREATED, {
    actor: actorId || ride.student,
    ride: ride._id,
    group: group._id,
    message: `Group created (${isPrivate ? 'private' : 'public'})`,
  });
  await logEvent(EVENT_LOG_TYPE.BOOKER_ASSIGNED, { actor: ride.student, group: group._id, message: 'Creator set as booker' });
  return RideGroup.findById(group._id);
}

async function joinGroup(group, ride, userId) {
  if (BOOKED.includes(group.status) || TERMINAL.includes(group.status)) {
    const err = new Error('This group is no longer accepting riders');
    err.status = 409;
    throw err;
  }
  if (group.memberCount >= group.capacity) {
    const err = new Error('Group is full');
    err.status = 409;
    throw err;
  }
  await addRider(group, ride, userId);
  // If a fare was already finalized (e.g. group re-opened after a cab cancel), flag it stale.
  const staleFare = await FareRecord.findOne({ group: group._id, finalized: true });
  if (staleFare && !staleFare.fareChanged) { staleFare.fareChanged = true; await staleFare.save(); }
  await logEvent(EVENT_LOG_TYPE.RIDER_JOINED, { actor: userId, ride: ride._id, group: group._id, message: 'Rider joined' });
  await logEvent(EVENT_LOG_TYPE.RIDE_MATCHED, { actor: userId, ride: ride._id, group: group._id });
  const user = await User.findById(userId).lean();
  await notifyMembers(group._id, {
    type: NOTIFICATION_TYPE.USER_JOINED,
    title: 'New rider joined',
    body: `${user ? user.name || 'A rider' : 'A rider'} joined your ride group`,
    excludeUserId: userId,
  });
  return recomputeGroup(group._id);
}

async function leaveGroup(group, userId) {
  const member = await GroupMember.findOne({ group: group._id, user: userId, isActive: true });
  if (!member) {
    const err = new Error('You are not an active member of this group');
    err.status = 404;
    throw err;
  }
  const wasBooker = String(group.bookerId) === String(userId);
  const afterBooking = BOOKED.includes(group.status);

  member.isActive = false;
  member.leftAt = new Date();
  member.leftAfterBooking = afterBooking;
  await member.save();

  // Release their ride back to the pool if the cab is not yet booked.
  if (member.ride) {
    if (afterBooking) {
      // Keep the ride attached (they still owe their share) but flag re-match check.
      await RideGroup.updateOne({ _id: group._id }, { $set: { rematchNeeded: true } });
    } else {
      await Ride.updateOne({ _id: member.ride }, { $set: { group: null, status: RIDE_STATUS.OPEN } });
      await RideGroup.updateOne({ _id: group._id }, { $pull: { rides: member.ride } });
    }
  }
  await RideGroup.updateOne({ _id: group._id }, { $pull: { members: member._id } });

  await logEvent(EVENT_LOG_TYPE.RIDER_LEFT, {
    actor: userId,
    group: group._id,
    message: afterBooking ? 'Rider left after cab booked (still owes share)' : 'Rider left before booking',
  });

  const remaining = await GroupMember.countDocuments({ group: group._id, isActive: true });
  if (remaining === 0) {
    await cancelGroup(await RideGroup.findById(group._id), 'All riders left · group dissolved', userId);
    return RideGroup.findById(group._id);
  }

  // Booker left — requires transfer. Flag vacancy + notify remaining riders.
  if (wasBooker) {
    await RideGroup.updateOne({ _id: group._id }, { $set: { bookerId: null, noBookerFlag: true } });
    await logEvent(EVENT_LOG_TYPE.BOOKER_VACANT, { actor: userId, group: group._id, message: 'Booker left — awaiting transfer' });
    await notifyMembers(group._id, {
      type: NOTIFICATION_TYPE.BOOKER_NEEDED,
      title: 'Booker needed',
      body: 'Your group needs a new booker. Tap to accept the role.',
      excludeUserId: userId,
    });
  } else {
    await notifyMembers(group._id, {
      type: NOTIFICATION_TYPE.USER_LEFT,
      title: 'A rider left',
      body: 'A rider left your ride group.',
      excludeUserId: userId,
    });
  }
  return recomputeGroup(group._id);
}

async function assignBooker(group, newBookerId, actorId) {
  const member = await GroupMember.findOne({ group: group._id, user: newBookerId, isActive: true });
  if (!member) {
    const err = new Error('That user is not an active rider in this group');
    err.status = 400;
    throw err;
  }
  const prev = group.bookerId;
  await GroupMember.updateMany({ group: group._id, role: MEMBER_ROLE.BOOKER }, { $set: { role: MEMBER_ROLE.MEMBER } });
  member.role = MEMBER_ROLE.BOOKER;
  await member.save();
  await RideGroup.updateOne({ _id: group._id }, { $set: { bookerId: newBookerId, noBookerFlag: false, adminFlag: false } });
  await logEvent(prev ? EVENT_LOG_TYPE.BOOKER_TRANSFERRED : EVENT_LOG_TYPE.BOOKER_ASSIGNED, {
    actor: actorId,
    group: group._id,
    message: `Booker set to ${newBookerId}`,
    meta: { from: prev, to: newBookerId },
  });
  const u = await User.findById(newBookerId).lean();
  await notifyMembers(group._id, {
    type: NOTIFICATION_TYPE.BOOKER_ASSIGNED,
    title: 'Booker assigned',
    body: `${u ? u.name || 'A rider' : 'A rider'} is now the booker.`,
  });
  return RideGroup.findById(group._id);
}

async function bookGroup(group, actorId) {
  if (!group.bookerId) {
    const err = new Error('Assign a booker before booking');
    err.status = 400;
    throw err;
  }
  if (BOOKED.includes(group.status)) return group;
  group.status = GROUP_STATUS.CONFIRMED;
  group.bookedAt = new Date();
  const bookerRide = await Ride.findOne({ group: group._id, student: group.bookerId }).lean();
  group.bookingInfoMissing = !bookerRide || !bookerRide.flightInfo || !bookerRide.pickupLocation;
  await group.save();
  if (group.bookingInfoMissing) {
    await RideGroup.updateOne({ _id: group._id }, { $set: { adminFlag: true } });
    await logEvent(EVENT_LOG_TYPE.GROUP_STATUS_CHANGED, { actor: actorId, group: group._id, message: 'Booked but booking info incomplete' });
  }
  await Ride.updateMany({ group: group._id }, { $set: { status: RIDE_STATUS.CONFIRMED } });
  await logEvent(EVENT_LOG_TYPE.GROUP_BOOKED, { actor: actorId, group: group._id, message: 'Cab booked' });
  await notifyMembers(group._id, {
    type: NOTIFICATION_TYPE.GROUP_BOOKED,
    title: 'Cab booked',
    body: 'Your booker confirmed the cab. Check the fare split.',
  });
  return group;
}

async function enterFare(group, totalCost, actorId) {
  const members = await GroupMember.find({ group: group._id, isActive: true }).lean();
  const booker = await User.findById(group.bookerId).lean();
  const riders = members.map((m) => ({ userId: m.user, isBooker: String(m.user) === String(group.bookerId) }));
  const shares = computeShares(round2(totalCost), riders);

  let fare = await FareRecord.findOne({ group: group._id });
  const isChange = !!fare && fare.finalized;
  if (!fare) fare = new FareRecord({ group: group._id });
  fare.booker = group.bookerId;
  fare.bookerPaymentHandle = (booker && booker.paymentHandle) || '';
  fare.totalCost = round2(totalCost);
  fare.riderCount = riders.length;
  fare.perRiderShare = shares.length ? shares[0].amount : 0;
  // Preserve prior payment confirmations across a fare change.
  if (isChange) {
    const prevMap = new Map((fare.shares || []).map((s) => [String(s.user), s]));
    shares.forEach((s) => {
      const prev = prevMap.get(String(s.user));
      if (prev && prev.paymentConfirmed) {
        s.paymentConfirmed = true;
        s.confirmedAt = prev.confirmedAt;
      }
    });
    fare.fareChanged = true;
  }
  fare.shares = shares;
  fare.finalized = true;
  fare.enteredAt = new Date();
  await fare.save();

  await RideGroup.updateOne({ _id: group._id }, { $set: { fareRecord: fare._id, estimatedTotalFare: round2(totalCost) } });
  await logEvent(isChange ? EVENT_LOG_TYPE.FARE_CHANGED : EVENT_LOG_TYPE.FARE_ENTERED, {
    actor: actorId,
    group: group._id,
    message: `Fare ${isChange ? 'changed' : 'entered'}: ${round2(totalCost)}`,
    meta: { totalCost: round2(totalCost) },
  });
  await notifyMembers(group._id, {
    type: isChange ? NOTIFICATION_TYPE.FARE_CHANGED : NOTIFICATION_TYPE.FARE_ENTERED,
    title: isChange ? 'Fare updated' : 'Fare ready',
    body: `Your share is $${(shares[0] && shares[0].amount) || 0}. Tap to pay the booker.`,
    excludeUserId: group.bookerId,
  });
  return fare;
}

async function confirmPayment(group, userId, actorId) {
  const fare = await FareRecord.findOne({ group: group._id });
  if (!fare) {
    const err = new Error('No fare has been entered yet');
    err.status = 400;
    throw err;
  }
  const share = fare.shares.find((s) => String(s.user) === String(userId));
  if (!share) {
    const err = new Error('No share found for this rider');
    err.status = 404;
    throw err;
  }
  share.paymentConfirmed = true;
  share.overdue = false;
  share.confirmedAt = new Date();
  await fare.save();
  await GroupMember.updateOne(
    { group: group._id, user: userId, isActive: true },
    { $set: { paymentConfirmed: true, paymentConfirmedAt: new Date(), overdue: false } }
  );
  await logEvent(EVENT_LOG_TYPE.PAYMENT_CONFIRMED, { actor: actorId || userId, group: group._id, message: `Payment confirmed for ${userId}` });
  if (group.bookerId) {
    await notificationService.notify(group.bookerId, {
      type: NOTIFICATION_TYPE.PAYMENT_CONFIRMED,
      title: 'Payment received',
      body: 'A rider marked their share as paid.',
      data: { groupId: group._id },
    });
  }
  return fare;
}

async function completeGroup(group, actorId) {
  if (TERMINAL.includes(group.status)) {
    const err = new Error(`Cannot complete a ${group.status} group`);
    err.status = 409;
    throw err;
  }
  group.status = GROUP_STATUS.COMPLETED;
  group.completedAt = new Date();
  await group.save();
  await Ride.updateMany({ group: group._id }, { $set: { status: RIDE_STATUS.COMPLETED } });
  await logEvent(EVENT_LOG_TYPE.RIDE_COMPLETED, { actor: actorId, group: group._id, message: 'Ride completed' });
  await notifyMembers(group._id, {
    type: NOTIFICATION_TYPE.RATING_REMINDER,
    title: 'Rate your riders',
    body: 'Your ride is complete. Leave a rating for your group.',
  });
  return group;
}

async function cancelGroup(group, reason, actorId) {
  group.status = GROUP_STATUS.CANCELLED;
  group.cancelledAt = new Date();
  group.cancelReason = reason || 'Cancelled';
  await group.save();
  await Ride.updateMany({ group: group._id }, { $set: { status: RIDE_STATUS.CANCELLED, cancelReason: reason || 'Group cancelled' } });
  await logEvent(EVENT_LOG_TYPE.GROUP_CANCELLED, { actor: actorId, group: group._id, message: reason || 'Cancelled' });
  await notifyMembers(group._id, {
    type: NOTIFICATION_TYPE.RIDE_CANCELLED,
    title: 'Ride cancelled',
    body: reason || 'Your ride group was cancelled.',
  });
  return group;
}

// Ride reaches pickup time — move the confirmed cab into progress.
async function startGroup(group, actorId) {
  if (group.status !== GROUP_STATUS.CONFIRMED) {
    const err = new Error('Only a booked group can be started');
    err.status = 409;
    throw err;
  }
  group.status = GROUP_STATUS.IN_PROGRESS;
  group.startedAt = new Date();
  await group.save();
  await Ride.updateMany({ group: group._id }, { $set: { status: RIDE_STATUS.IN_PROGRESS } });
  await logEvent(EVENT_LOG_TYPE.RIDE_STATUS_CHANGED, { actor: actorId, group: group._id, message: 'Ride in progress (pickup time reached)' });
  await notifyMembers(group._id, { type: NOTIFICATION_TYPE.RIDE_REMINDER, title: 'Ride starting', body: 'Your ride is now in progress. Head to the pickup point.' });
  return group;
}

// Driver delayed — flag + notify riders (no status change).
async function markDelayed(group, actorId) {
  group.delayed = true;
  await group.save();
  await logEvent(EVENT_LOG_TYPE.RIDE_STATUS_CHANGED, { actor: actorId, group: group._id, message: 'Driver reported delayed' });
  await notifyMembers(group._id, { type: NOTIFICATION_TYPE.RIDE_REMINDER, title: 'Driver delayed', body: 'Your driver is running late. Hang tight.' });
  return group;
}

// Booker/admin removes a rider for non-payment.
async function removeRider(group, targetUserId, actorId) {
  const member = await GroupMember.findOne({ group: group._id, user: targetUserId, isActive: true });
  if (!member) {
    const err = new Error('That rider is not active in this group');
    err.status = 404;
    throw err;
  }
  member.removedForNonPayment = true;
  await member.save();
  await leaveGroup(group, targetUserId);
  await logEvent(EVENT_LOG_TYPE.RIDER_LEFT, { actor: actorId, group: group._id, message: `Rider ${targetUserId} removed for non-payment` });
  return RideGroup.findById(group._id);
}

async function markCabCancelled(group, actorId) {
  group.cabCancelled = true;
  group.bookedAt = null;
  if (!TERMINAL.includes(group.status)) group.status = GROUP_STATUS.OPEN;
  await group.save();
  await Ride.updateMany({ group: group._id }, { $set: { status: RIDE_STATUS.GROUPED } });
  await recomputeGroup(group._id);
  await logEvent(EVENT_LOG_TYPE.CAB_CANCELLED, { actor: actorId, group: group._id, message: 'Cab cancelled externally' });
  await notifyMembers(group._id, {
    type: NOTIFICATION_TYPE.CAB_CANCELLED,
    title: 'Cab cancelled',
    body: 'The booked cab was cancelled. Your group is open again.',
  });
  return RideGroup.findById(group._id);
}

// Full API shape for a group. Pass currentUserId to expose booker-only fields.
async function serializeGroup(groupId, currentUserId) {
  const group = await RideGroup.findById(groupId).populate('airport').lean();
  if (!group) return null;
  const members = await GroupMember.find({ group: groupId, isActive: true })
    .populate('user', 'name profileImage reliabilityScore pickupPreferences')
    .populate('ride', 'flightTime checkedBags pickupLocation flightInfo passengerCount terminal')
    .lean();
  const fare = await FareRecord.findOne({ group: groupId }).lean();

  const isBooker = currentUserId && String(group.bookerId) === String(currentUserId);
  const perPerson = group.memberCount ? round2(group.estimatedTotalFare / group.memberCount) : 0;
  const solo = group.soloFareEstimate || DEFAULTS.DEFAULT_SOLO_FARE;
  const savingsPct = solo ? Math.max(0, Math.round((1 - perPerson / solo) * 100)) : 0;

  const memberViews = members.map((m) => {
    const u = m.user || {};
    const shareRec = fare && (fare.shares || []).find((s) => String(s.user) === String(u._id));
    return {
      userId: u._id,
      name: u.name || 'Rider',
      initials: initials(u.name),
      profileImage: u.profileImage || '',
      reliabilityScore: u.reliabilityScore ?? null,
      flightTime: m.ride && m.ride.flightTime,
      checkedBags: (m.ride && m.ride.checkedBags) || 0,
      terminal: (m.ride && m.ride.terminal) || undefined,
      isBooker: String(group.bookerId) === String(u._id),
      paymentConfirmed: shareRec ? shareRec.paymentConfirmed : m.paymentConfirmed || false,
      share: shareRec ? shareRec.amount : null,
      // Booker-only: private pickup address of each rider.
      pickupAddress: isBooker ? (m.ride && m.ride.pickupLocation) || u.pickupPreferences || '' : undefined,
    };
  });

  return {
    id: group._id,
    university: group.university,
    direction: group.direction,
    airport: group.airport ? { id: group.airport._id, code: group.airport.code, name: group.airport.name } : null,
    destinationType: group.destinationType || 'airport',
    customDestinationName: group.customDestinationName || '',
    type: group.type,
    inviteCode: group.type === GROUP_TYPE.PRIVATE ? group.inviteCode : undefined,
    status: group.status,
    capacity: group.capacity,
    memberCount: group.memberCount,
    totalBags: group.totalBags,
    travelDate: group.travelDate,
    flightWindowStart: group.flightWindowStart,
    flightWindowEnd: group.flightWindowEnd,
    suggestedDeparture: group.suggestedDeparture,
    bookingDeadline: group.bookingDeadline,
    vehicleSuggestion: group.vehicleSuggestion,
    vehicleCapacity: group.vehicleCapacity,
    estimatedTotalFare: group.estimatedTotalFare,
    soloFareEstimate: solo,
    perPerson,
    savingsPct,
    bookerId: group.bookerId,
    isCurrentUserBooker: !!isBooker,
    noBookerFlag: group.noBookerFlag,
    cabCancelled: group.cabCancelled,
    rematchNeeded: group.rematchNeeded,
    delayed: !!group.delayed,
    bookingInfoMissing: !!group.bookingInfoMissing,
    members: memberViews,
    fare: fare
      ? {
          totalCost: fare.totalCost,
          perRiderShare: fare.perRiderShare,
          finalized: fare.finalized,
          fareChanged: fare.fareChanged,
          bookerPaymentHandle: fare.bookerPaymentHandle,
          shares: (fare.shares || []).map((s) => ({
            user: s.user,
            amount: s.amount,
            percent: s.percent,
            paymentConfirmed: s.paymentConfirmed,
            overdue: s.overdue,
          })),
        }
      : null,
    createdAt: group.createdAt,
  };
}

module.exports = {
  recomputeGroup,
  createGroupFromRide,
  joinGroup,
  leaveGroup,
  assignBooker,
  bookGroup,
  enterFare,
  confirmPayment,
  completeGroup,
  cancelGroup,
  markCabCancelled,
  startGroup,
  markDelayed,
  removeRider,
  serializeGroup,
  initials,
  logEvent,
};
