// Chat service — persist + broadcast group messages and system events.
const { Message, GroupMember, User } = require('../models');
const { MESSAGE_TYPE, NOTIFICATION_TYPE } = require('../config/constants');
const notificationService = require('./notificationService');

function initials(name = '') {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  return ((p[0] ? p[0][0] : '?') + (p[1] ? p[1][0] : '')).toUpperCase();
}

function serialize(msg, sender) {
  return {
    id: msg._id,
    group: msg.group,
    text: msg.text,
    isSystemMessage: msg.type === MESSAGE_TYPE.SYSTEM,
    sender: sender
      ? { id: sender._id || sender.id, name: sender.name, initials: initials(sender.name) }
      : null,
    createdAt: msg.createdAt,
  };
}

function emit(groupId, payload) {
  const io = notificationService.getIo();
  if (io) io.to(`group:${groupId}`).emit('chat:message', payload);
}

async function postMessage(groupId, senderId, text) {
  const doc = await Message.create({ group: groupId, sender: senderId, text, type: MESSAGE_TYPE.TEXT });
  const sender = await User.findById(senderId).select('name').lean();
  const view = serialize(doc, sender);
  emit(groupId, view);

  // Notify other active members of a new chat message.
  const members = await GroupMember.find({ group: groupId, isActive: true }).lean();
  await Promise.all(
    members
      .filter((m) => String(m.user) !== String(senderId))
      .map((m) =>
        notificationService.notify(m.user, {
          type: NOTIFICATION_TYPE.CHAT_MESSAGE,
          title: 'New message',
          body: `${sender ? sender.name : 'Someone'}: ${text.slice(0, 60)}`,
          data: { groupId },
        })
      )
  );
  return view;
}

async function postSystem(groupId, text) {
  const doc = await Message.create({ group: groupId, text, type: MESSAGE_TYPE.SYSTEM });
  const view = serialize(doc, null);
  emit(groupId, view);
  return view;
}

module.exports = { postMessage, postSystem, serialize, initials };
