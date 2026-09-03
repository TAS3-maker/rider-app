// Notification service. Persists a Notification and emits it in real time.
const Notification = require('../models/Notification');

let io = null;
function setIo(socketServer) {
  io = socketServer;
}
function getIo() {
  return io;
}

async function notify(userId, { type, title, body = '', data = {} }) {
  if (!userId) return null;
  const doc = await Notification.create({ user: userId, type, title, body, data });
  if (io) io.to(`user:${userId}`).emit('notification', serialize(doc));
  return doc;
}

function serialize(doc) {
  return {
    id: doc._id,
    type: doc.type,
    title: doc.title,
    body: doc.body,
    data: doc.data,
    read: doc.read,
    createdAt: doc.createdAt,
  };
}

module.exports = { setIo, getIo, notify, serialize };
