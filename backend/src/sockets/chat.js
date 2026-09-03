// Real-time group chat socket handlers.
const chatService = require('../services/chatService');
const { GroupMember } = require('../models');

module.exports = function registerChat(io) {
  io.on('connection', (socket) => {
    socket.on('chat:join', async (groupId) => {
      if (!groupId || !socket.userId) return;
      // Only active members may subscribe to a group's chat room.
      const member = await GroupMember.findOne({ group: groupId, user: socket.userId, isActive: true }).lean();
      if (member) socket.join(`group:${groupId}`);
    });
    socket.on('chat:leave', (groupId) => {
      if (groupId) socket.leave(`group:${groupId}`);
    });
    // Persist + broadcast (only for authenticated active members).
    socket.on('chat:send', async (payload, ack) => {
      try {
        const groupId = payload && payload.groupId;
        const text = payload && String(payload.text || '').trim();
        if (!groupId || !text || !socket.userId) return;
        const member = await GroupMember.findOne({ group: groupId, user: socket.userId, isActive: true });
        if (!member) return;
        const view = await chatService.postMessage(groupId, socket.userId, text);
        if (typeof ack === 'function') ack({ ok: true, message: view });
      } catch (e) {
        if (typeof ack === 'function') ack({ ok: false, error: e.message });
      }
    });
  });
};
