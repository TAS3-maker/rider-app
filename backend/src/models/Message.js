const { mongoose } = require('../config/db');
const { MESSAGE_TYPE } = require('../config/constants');

const messageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'RideGroup', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    type: { type: String, enum: Object.values(MESSAGE_TYPE), default: MESSAGE_TYPE.TEXT },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
