// Rating routes — Phase 0 placeholders (logic added in Phase 3).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/mine', (req, res) => res.json({ data: [], message: 'Ratings — coming in Phase 3' }));
router.post('/', (req, res) => res.status(501).json({ error: 'Submit rating — coming in Phase 3' }));

module.exports = router;
