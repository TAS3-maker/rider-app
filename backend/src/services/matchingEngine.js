// Rule-based ride matching engine (scaffold for Phase 2).
// Deterministic — no AI. Fills in during a later phase.
const { DEFAULTS } = require('../config/constants');

/**
 * Given a ride, find compatible existing groups using the SOW rules:
 * same university, direction, airport, travel date, flight time within window,
 * available capacity, luggage compatibility, group availability/status.
 * Phase 0: returns an empty candidate list.
 */
async function findCompatibleGroups(/* ride, settings */) {
  return [];
}

async function matchRide(/* ride */) {
  return { matched: false, group: null, windowMinutes: DEFAULTS.MATCH_WINDOW_MINUTES };
}

module.exports = { findCompatibleGroups, matchRide };
