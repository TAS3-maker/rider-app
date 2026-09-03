const { RideGroup, FareRecord } = require('../models');
const { ROLES } = require('../config/constants');
const groupService = require('../services/groupService');

async function enter(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (req.user.role !== ROLES.ADMIN && String(group.bookerId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the booker can enter the fare' });
    }
    const total = Number(req.body.totalCost);
    if (!Number.isFinite(total) || total <= 0) return res.status(400).json({ error: 'A valid totalCost is required' });
    await groupService.enterFare(group, total, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const view = await groupService.serializeGroup(req.params.groupId, req.user._id);
    if (!view) return res.status(404).json({ error: 'Group not found' });
    res.json({ data: view.fare, group: { id: view.id, bookerId: view.bookerId, members: view.members } });
  } catch (e) {
    next(e);
  }
}

async function confirm(req, res, next) {
  try {
    const group = await RideGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const targetId = req.body.userId || String(req.user._id);
    // Riders confirm their own payment; the booker may confirm on anyone's behalf.
    if (String(targetId) !== String(req.user._id) && String(group.bookerId) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'You can only confirm your own payment' });
    }
    await groupService.confirmPayment(group, targetId, req.user._id);
    res.json({ data: await groupService.serializeGroup(group._id, req.user._id) });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

module.exports = { enter, get, confirm };
