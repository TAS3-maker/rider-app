const { mongoose } = require('../config/db');

const ratingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup', index: true },
    // fromUser rates toUser (ratings are anonymous to the rated user).
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reliabilityStars: { type: Number, min: 1, max: 5, required: true },
    punctualityStars: { type: Number, min: 1, max: 5, required: true },
    // Confirmed = showed up; false = flaked.
    confirmed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One rating per (group, rater, ratee).
ratingSchema.index({ group: 1, rater: 1, ratee: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
