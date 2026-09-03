// Fare split coordination. No real payment processing — external/manual pay only.
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Even split: total ÷ riders. Any rounding remainder is absorbed by the booker
 * so the shares sum exactly to the total.
 * @param {number} totalCost
 * @param {Array<{userId, isBooker}>} riders
 */
function computeShares(totalCost, riders) {
  const n = riders.length;
  if (!n || !totalCost) return riders.map((r) => ({ user: r.userId, amount: 0, percent: 0, paymentConfirmed: false, overdue: false }));
  const even = round2(totalCost / n);
  const shares = riders.map((r) => ({
    user: r.userId,
    amount: even,
    percent: round2((even / totalCost) * 100),
    paymentConfirmed: false,
    overdue: false,
  }));
  // Absorb rounding drift into the booker's (or first) share.
  const sum = round2(shares.reduce((s, x) => s + x.amount, 0));
  const drift = round2(totalCost - sum);
  if (drift !== 0) {
    const idx = riders.findIndex((r) => r.isBooker);
    const t = idx >= 0 ? idx : 0;
    shares[t].amount = round2(shares[t].amount + drift);
    shares[t].percent = round2((shares[t].amount / totalCost) * 100);
  }
  return shares;
}

module.exports = { computeShares, round2 };
