const { mongoose } = require('../config/db');

const airportSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true }, // e.g. DTW
    name: { type: String, required: true, trim: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Airport', airportSchema);
