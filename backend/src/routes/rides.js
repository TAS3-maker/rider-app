// Ride routes — Phase 0 placeholders (logic added in Phase 2).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => res.json({ data: [], message: 'Ride discovery — coming in Phase 2' }));
router.get('/mine', (req, res) => res.json({ data: [], message: 'Ride history — coming in Phase 2' }));
router.post('/', (req, res) => res.status(501).json({ error: 'Ride creation — coming in Phase 2' }));
router.get('/:id', (req, res) => res.status(501).json({ error: 'Ride details — coming in Phase 2' }));

module.exports = router;
