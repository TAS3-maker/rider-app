// Reliability score service. Rolling average of received reliability + punctuality
// stars across completed rides, blended with a neutral 5.0 baseline for new users.
const User = require('../models/User');
const Rating = require('../models/Rating');

async function recomputeReliability(userId) {
  const ratings = await Rating.find({ ratee: userId }).select('reliabilityStars punctualityStars').lean();
  if (!ratings.length) {
    await User.updateOne({ _id: userId }, { $set: { reliabilityScore: 5, ratingsCount: 0 } });
    return 5;
  }
  const total = ratings.reduce((s, r) => s + ((r.reliabilityStars || 0) + (r.punctualityStars || 0)) / 2, 0);
  const avg = total / ratings.length;
  const score = Math.round(avg * 10) / 10;
  await User.updateOne({ _id: userId }, { $set: { reliabilityScore: score, ratingsCount: ratings.length } });
  return score;
}

module.exports = { recomputeReliability };
