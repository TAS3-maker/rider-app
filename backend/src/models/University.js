const { mongoose } = require('../config/db');

const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    emailDomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('University', universitySchema);
