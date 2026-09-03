// Rule-based ride matching engine. Deterministic — NO AI.
const { RideGroup, PlatformSetting } = require('../models');
const { GROUP_STATUS, DEFAULTS } = require('../config/constants');

const MIN = 60 * 1000;

async function getMatchWindowMinutes() {
  const s = await PlatformSetting.findOne({ key: 'matchWindowMinutes' }).lean();
  const v = s && Number(s.value);
  return Number.isFinite(v) && v > 0 ? v : DEFAULTS.MATCH_WINDOW_MINUTES;
}

// Earliest flight in a set of rides drives the group's schedule.
function computeTimes(flightTimes) {
  const times = (flightTimes || []).filter(Boolean).map((t) => new Date(t).getTime());
  if (!times.length) return { earliestFlight: null, latestFlight: null, suggestedDeparture: null, bookingDeadline: null };
  const earliest = Math.min(...times);
  const latest = Math.max(...times);
  const suggestedDeparture = earliest - DEFAULTS.DEPARTURE_BUFFER_MINUTES * MIN;
  const bookingDeadline = suggestedDeparture - DEFAULTS.BOOKING_BUFFER_MINUTES * MIN;
  return {
    earliestFlight: new Date(earliest),
    latestFlight: new Date(latest),
    suggestedDeparture: new Date(suggestedDeparture),
    bookingDeadline: new Date(bookingDeadline),
  };
}

// Suggest a vehicle from head-count + total bags.
function vehicleSuggestion(memberCount, totalBags) {
  const needsLarge = memberCount > DEFAULTS.VEHICLE_STANDARD_SEATS || totalBags >= DEFAULTS.LARGE_VEHICLE_BAG_THRESHOLD;
  return needsLarge
    ? { name: 'UberXL', capacity: DEFAULTS.VEHICLE_LARGE_SEATS }
    : { name: 'UberX', capacity: DEFAULTS.VEHICLE_STANDARD_SEATS };
}

function sameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth() && da.getUTCDate() === db.getUTCDate();
}

/**
 * Find groups compatible with a ride, ranked best-first. Rules evaluated in order:
 * same university, same direction, same airport, same travel date, flight time within
 * window, available vehicle/group capacity, luggage compatibility, open group status.
 * Returns [{ group, score, flightGapMinutes }].
 */
async function findCompatibleGroups(ride) {
  const windowMin = await getMatchWindowMinutes();
  const windowMs = windowMin * MIN;

  const dayStart = new Date(ride.travelDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  // Rules 1-4 + status via query; public groups only.
  const groups = await RideGroup.find({
    university: ride.university,
    direction: ride.direction,
    airport: ride.airport,
    type: 'public',
    travelDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: [GROUP_STATUS.OPEN, GROUP_STATUS.NEARLY_FULL] },
  }).lean();

  const flightMs = new Date(ride.flightTime).getTime();
  const rideBags = ride.checkedBags || 0;
  const candidates = [];

  for (const g of groups) {
    if (ride.group && g._id.equals(ride.group)) continue;
    // Rule 5: flight time within window of the group's existing flight window.
    const start = g.flightWindowStart ? new Date(g.flightWindowStart).getTime() : flightMs;
    const end = g.flightWindowEnd ? new Date(g.flightWindowEnd).getTime() : flightMs;
    if (flightMs < start - windowMs || flightMs > end + windowMs) continue;
    // Rule 6: available capacity.
    if ((g.memberCount || 0) >= g.capacity) continue;
    // Rule 7: luggage compatibility — projected bags must fit the vehicle.
    const projectedBags = (g.totalBags || 0) + rideBags;
    const projectedMembers = (g.memberCount || 0) + 1;
    const veh = vehicleSuggestion(projectedMembers, projectedBags);
    if (projectedBags > veh.capacity + 2) continue; // generous bag allowance per seat
    if (!sameDay(g.travelDate, ride.travelDate)) continue;

    const flightGapMinutes = Math.round(Math.min(Math.abs(flightMs - start), Math.abs(flightMs - end)) / MIN);
    // Score: closer flight times + fuller groups rank higher.
    const score = 1000 - flightGapMinutes + (g.memberCount || 0) * 10;
    candidates.push({ group: g, score, flightGapMinutes });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

module.exports = { findCompatibleGroups, computeTimes, vehicleSuggestion, getMatchWindowMinutes };
