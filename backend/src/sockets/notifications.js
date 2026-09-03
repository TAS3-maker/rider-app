// Real-time notification socket handlers (scaffold for Phase 3).
module.exports = function registerNotifications(io) {
  io.on('connection', (socket) => {
    socket.on('notifications:subscribe', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });
  });
};
