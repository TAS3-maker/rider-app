// Chat routes — Phase 0 placeholders (real-time chat added in Phase 3).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/:groupId/messages', (req, res) =>
  res.json({ data: [], message: 'Group chat — coming in Phase 3' })
);
router.post('/:groupId/messages', (req, res) =>
  res.status(501).json({ error: 'Send message — coming in Phase 3' })
);

module.exports = router;
