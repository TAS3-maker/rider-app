const { mongoose } = require('../config/db');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    username: { type: String, trim: true },
    profileImage: { type: String, default: '' },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, default: '' },
    pickupPreferences: { type: String, default: '' },
    pickupAddress: { type: String, default: '' },
    luggageInfo: { type: String, default: '' },
    paymentHandle: { type: String, default: '' }, // Venmo/Zelle-style handle, text only

    reliabilityScore: { type: Number, default: 5 },
    ratingsCount: { type: Number, default: 0 },

    role: { type: String, enum: Object.values(ROLES), default: ROLES.STUDENT },
    isActive: { type: Boolean, default: true },

    emailVerified: { type: Boolean, default: false },
    verificationCodeHash: { type: String, select: false },
    verificationExpiresAt: { type: Date },
    resetTokenHash: { type: String, select: false },
    resetExpiresAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    profileImage: this.profileImage,
    university: this.university,
    email: this.email,
    phone: this.phone,
    pickupPreferences: this.pickupPreferences,
    pickupAddress: this.pickupAddress,
    luggageInfo: this.luggageInfo,
    paymentHandle: this.paymentHandle,
    reliabilityScore: this.reliabilityScore,
    ratingsCount: this.ratingsCount,
    role: this.role,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
