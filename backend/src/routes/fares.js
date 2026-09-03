// Fare routes — Phase 0 placeholders (fare split added in Phase 2).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/group/:groupId', (req, res) =>
  res.status(501).json({ error: 'Fare split — coming in Phase 2' })
);
router.post('/group/:groupId/confirm', (req, res) =>
  res.status(501).json({ error: 'Payment confirmation — coming in Phase 2' })
);

module.exports = router;
