const { mongoose } = require('../config/db');
const {
  RIDE_DIRECTION,
  GROUP_STATUS,
  GROUP_TYPE,
  PICKUP_MODE,
  DEFAULTS,
  DESTINATION_TYPE,
} = require('../config/constants');

const rideGroupSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', index: true },
    direction: { type: String, enum: Object.values(RIDE_DIRECTION), required: true, index: true },
    airport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', index: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },

    // Airport (auto-computed times) vs custom destination (manual departure, no auto-calc).
    destinationType: { type: String, enum: Object.values(DESTINATION_TYPE), default: DESTINATION_TYPE.AIRPORT },
    customDestinationName: { type: String, default: '' },

    travelDate: { type: Date, required: true, index: true },
    flightWindowStart: { type: Date },
    flightWindowEnd: { type: Date },
    // Derived scheduling.
    suggestedDeparture: { type: Date },
    bookingDeadline: { type: Date },

    // Rides + members belonging to this group.
    rides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GroupMember' }],

    type: { type: String, enum: Object.values(GROUP_TYPE), default: GROUP_TYPE.PUBLIC, index: true },
    inviteCode: { type: String, index: true, sparse: true },
    pickupMode: { type: String, enum: Object.values(PICKUP_MODE), default: PICKUP_MODE.MEET_POINT },

    capacity: { type: Number, default: DEFAULTS.GROUP_CAPACITY },
    vehicleCapacity: { type: Number, default: DEFAULTS.VEHICLE_STANDARD_SEATS },
    vehicleSuggestion: { type: String, default: '' },
    memberCount: { type: Number, default: 0 },
    totalBags: { type: Number, default: 0 },

    status: { type: String, enum: Object.values(GROUP_STATUS), default: GROUP_STATUS.OPEN, index: true },
    bookerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fareRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'FareRecord' },

    estimatedTotalFare: { type: Number, default: 0 },
    soloFareEstimate: { type: Number, default: DEFAULTS.DEFAULT_SOLO_FARE },
    currency: { type: String, default: 'USD' },

    bookedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },

    // Edge-case flags.
    noBookerFlag: { type: Boolean, default: false },
    adminFlag: { type: Boolean, default: false },
    delayed: { type: Boolean, default: false },
    bookingInfoMissing: { type: Boolean, default: false },
    cabCancelled: { type: Boolean, default: false },
    rematchNeeded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RideGroup', rideGroupSchema);
