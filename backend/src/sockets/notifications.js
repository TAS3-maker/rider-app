// Real-time notification socket handlers. Each authenticated socket auto-joins
// its own user room so notificationService can push in real time.
module.exports = function registerNotifications(io) {
  io.on('connection', (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
    socket.on('notifications:subscribe', () => {
      if (socket.userId) socket.join(`user:${socket.userId}`);
    });
  });
};
