// Reliability score service (scaffold for Phase 3).
// Reliability is derived from completed-ride participation + received ratings.
const User = require('../models/User');
const Rating = require('../models/Rating');

async function recomputeReliability(userId) {
  const ratings = await Rating.find({ ratee: userId }).select('score');
  if (!ratings.length) return null;
  const avg = ratings.reduce((s, r) => s + r.score, 0) / ratings.length;
  const score = Math.round(avg * 10) / 10;
  await User.updateOne({ _id: userId }, { $set: { reliabilityScore: score, ratingsCount: ratings.length } });
  return score;
}

module.exports = { recomputeReliability };
