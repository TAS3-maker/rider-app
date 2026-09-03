// Fare split coordination (scaffold for Phase 2). No real payment processing.

/**
 * Even split of an estimated total across N riders.
 * Returns cents-safe rounding to 2 decimals.
 */
function splitFare(totalCost, riderCount) {
  if (!riderCount || riderCount < 1) return { perRiderShare: 0, riderCount: 0, totalCost: totalCost || 0 };
  const perRiderShare = Math.round((totalCost / riderCount) * 100) / 100;
  return { perRiderShare, riderCount, totalCost };
}

module.exports = { splitFare };
