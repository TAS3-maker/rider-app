const { mongoose } = require('../config/db');
const { RIDE_DIRECTION, RIDE_STATUS, DESTINATION_TYPE, TERMINAL } = require('../config/constants');

const rideSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', index: true },
    direction: { type: String, enum: Object.values(RIDE_DIRECTION), required: true, index: true },
    airport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', index: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },

    // Airport (smart, auto-computed times) vs a free-text custom destination (manual times).
    destinationType: { type: String, enum: Object.values(DESTINATION_TYPE), default: DESTINATION_TYPE.AIRPORT },
    customDestinationName: { type: String, default: '' },
    // DTW terminal — only relevant for airport_to_university. Stored + displayed, not matched on.
    terminal: { type: String, enum: Object.values(TERMINAL), default: undefined },

    travelDate: { type: Date, required: true, index: true },
    // Primary scheduling input — the flight departure (or arrival) time.
    flightTime: { type: Date, required: true },
    // Free-text airline & flight number, e.g. "Delta DL1234".
    flightInfo: { type: String, default: '' },

    pickupLocation: { type: String, default: '' },
    passengerCount: { type: Number, default: 1, min: 1 },
    checkedBags: { type: Number, default: 0, min: 0 },
    luggageInfo: { type: String, default: '' },
    flexible: { type: Boolean, default: false },
    // "I'm flexible on timing" toggle from the create-ride form.
    flexibleTiming: { type: Boolean, default: false },
    notes: { type: String, default: '' },

    status: { type: String, enum: Object.values(RIDE_STATUS), default: RIDE_STATUS.OPEN, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup', index: true },

    // Edge-case flags.
    rematchNeeded: { type: Boolean, default: false },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
