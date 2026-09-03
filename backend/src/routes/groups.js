// Ride group routes — Phase 0 placeholders (logic added in Phase 2).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => res.json({ data: [], message: 'Groups — coming in Phase 2' }));
router.get('/:id', (req, res) => res.status(501).json({ error: 'Group details — coming in Phase 2' }));
router.post('/:id/join', (req, res) => res.status(501).json({ error: 'Join group — coming in Phase 2' }));
router.post('/:id/leave', (req, res) => res.status(501).json({ error: 'Leave group — coming in Phase 2' }));

module.exports = router;
