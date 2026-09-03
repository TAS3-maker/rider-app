const { mongoose } = require('../config/db');
const { TRAVEL_EVENT_TYPE } = require('../config/constants');

const travelEventSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    type: { type: String, enum: Object.values(TRAVEL_EVENT_TYPE), default: TRAVEL_EVENT_TYPE.HOLIDAY },
    visible: { type: Boolean, default: true },
    demandCount: { type: Number, default: 0 },
    notification14dSent: { type: Boolean, default: false },
    notification3dSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TravelEvent', travelEventSchema);
