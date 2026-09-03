const { mongoose } = require('../config/db');

const ratingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup' },
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate ratings for the same rider on the same ride.
ratingSchema.index({ ride: 1, rater: 1, ratee: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
