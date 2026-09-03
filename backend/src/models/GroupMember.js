const { mongoose } = require('../config/db');
const { MEMBER_ROLE } = require('../config/constants');

const groupMemberSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    role: { type: String, enum: Object.values(MEMBER_ROLE), default: MEMBER_ROLE.MEMBER },
    paymentConfirmed: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
  },
  { timestamps: true }
);

groupMemberSchema.index({ group: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
