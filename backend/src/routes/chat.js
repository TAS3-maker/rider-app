const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Message, GroupMember } = require('../models');
const chatService = require('../services/chatService');

router.use(requireAuth);

async function isMember(groupId, userId) {
  return GroupMember.findOne({ group: groupId, user: userId, isActive: true }).lean();
}

// Paginated history (latest-first). Frontend loads more on scroll-up.
router.get('/:groupId/messages', async (req, res, next) => {
  try {
    if (!(await isMember(req.params.groupId, req.user._id))) return res.status(403).json({ error: 'Not a member of this group' });
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = { group: req.params.groupId };
    const [items, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('sender', 'name').lean(),
      Message.countDocuments(filter),
    ]);
    const data = items.map((m) => chatService.serialize(m, m.sender));
    res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});

router.post('/:groupId/messages', async (req, res, next) => {
  try {
    if (!(await isMember(req.params.groupId, req.user._id))) return res.status(403).json({ error: 'Not a member of this group' });
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message text is required' });
    const view = await chatService.postMessage(req.params.groupId, req.user._id, text);
    res.status(201).json({ data: view });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
