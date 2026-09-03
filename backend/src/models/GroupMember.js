const { mongoose } = require('../config/db');
const { MEMBER_ROLE } = require('../config/constants');

const groupMemberSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    role: { type: String, enum: Object.values(MEMBER_ROLE), default: MEMBER_ROLE.MEMBER },

    paymentConfirmed: { type: Boolean, default: false },
    paymentConfirmedAt: { type: Date },
    overdue: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    // True when a rider leaves after the cab was already booked (still owes their share).
    leftAfterBooking: { type: Boolean, default: false },
    removedForNonPayment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A user may re-join a group after leaving; enforce a single ACTIVE membership per group.
groupMemberSchema.index({ group: 1, user: 1, isActive: 1 });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
