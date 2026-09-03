const { mongoose } = require('../config/db');

const airportSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    name: { type: String, required: true },
    city: { type: String, default: '' },
    // Estimated solo cab fare (USD) used for savings calculations.
    baseFare: { type: Number, default: 57 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Airport', airportSchema);
