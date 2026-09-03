// Matching routes — Phase 0 placeholder (rule-based engine added in Phase 2).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.post('/run', (req, res) =>
  res.status(501).json({ error: 'Rule-based matching — coming in Phase 2' })
);

module.exports = router;
