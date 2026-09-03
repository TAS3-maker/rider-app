// Real-time group chat socket handlers (scaffold for Phase 3).
module.exports = function registerChat(io) {
  io.on('connection', (socket) => {
    socket.on('chat:join', (groupId) => {
      if (groupId) socket.join(`group:${groupId}`);
    });
    socket.on('chat:leave', (groupId) => {
      if (groupId) socket.leave(`group:${groupId}`);
    });
    // Message broadcast is wired to the DB in a later phase.
    socket.on('chat:message', (payload) => {
      if (payload && payload.groupId) {
        io.to(`group:${payload.groupId}`).emit('chat:message', payload);
      }
    });
  });
};
