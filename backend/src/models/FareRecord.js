const { mongoose } = require('../config/db');

const shareSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, default: 0 },
    paymentConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date },
  },
  { _id: false }
);

const fareRecordSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup', required: true, index: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    booker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalCost: { type: Number, default: 0 },
    riderCount: { type: Number, default: 0 },
    perRiderShare: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    shares: { type: [shareSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FareRecord', fareRecordSchema);
