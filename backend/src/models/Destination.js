const { mongoose } = require('../config/db');

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, default: 'campus' },
    code: { type: String, default: '' },
    terminals: { type: [String], default: [] },
    directions: { type: String, default: 'both' }, // campus | airport | area | other
    address: { type: String, default: '' },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Destination', destinationSchema);
