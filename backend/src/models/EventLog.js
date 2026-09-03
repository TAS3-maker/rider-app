const { mongoose } = require('../config/db');
const { EVENT_LOG_TYPE } = require('../config/constants');

const eventLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(EVENT_LOG_TYPE), required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup' },
    message: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventLog', eventLogSchema);
