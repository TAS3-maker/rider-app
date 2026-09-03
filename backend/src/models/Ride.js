const { mongoose } = require('../config/db');
const { RIDE_DIRECTION, RIDE_STATUS } = require('../config/constants');

const rideSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    direction: { type: String, enum: Object.values(RIDE_DIRECTION), required: true },
    airport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport' },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },

    travelDate: { type: Date, required: true },
    flightTime: { type: Date },
    airline: { type: String, default: '' },
    flightNumber: { type: String, default: '' },

    pickupLocation: { type: String, default: '' },
    pickupArea: { type: String, default: '' },
    passengers: { type: Number, default: 1 },
    checkedBags: { type: Number, default: 0 },
    luggageInfo: { type: String, default: '' },
    flexible: { type: Boolean, default: false },
    notes: { type: String, default: '' },

    status: { type: String, enum: Object.values(RIDE_STATUS), default: RIDE_STATUS.OPEN },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
