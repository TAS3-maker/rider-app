const { mongoose } = require('../config/db');

const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    emailDomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortName: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('University', universitySchema);
