const { mongoose } = require('../config/db');
const { RIDE_DIRECTION, GROUP_STATUS, DEFAULTS } = require('../config/constants');

const rideGroupSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    direction: { type: String, enum: Object.values(RIDE_DIRECTION), required: true },
    airport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport' },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },

    travelDate: { type: Date, required: true },
    flightWindowStart: { type: Date },
    flightWindowEnd: { type: Date },
    pickupArea: { type: String, default: '' },

    capacity: { type: Number, default: DEFAULTS.GROUP_CAPACITY },
    memberCount: { type: Number, default: 0 },

    status: { type: String, enum: Object.values(GROUP_STATUS), default: GROUP_STATUS.OPEN },
    booker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    estimatedTotalFare: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RideGroup', rideGroupSchema);
