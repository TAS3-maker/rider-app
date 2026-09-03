// Notification service (scaffold). Persists a Notification and can emit via sockets.
const Notification = require('../models/Notification');

let io = null;
function setIo(socketServer) {
  io = socketServer;
}

async function notify(userId, { type, title, body = '', data = {} }) {
  const doc = await Notification.create({ user: userId, type, title, body, data });
  if (io) io.to(`user:${userId}`).emit('notification', doc);
  return doc;
}

module.exports = { setIo, notify };
