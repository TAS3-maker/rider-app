const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/rideController');

router.use(requireAuth);

router.post('/', c.createRide);
router.get('/history', c.history);
router.get('/:id/matches', c.getRideMatches);
router.get('/:id', c.getRide);
router.patch('/:id', c.updateRide);
router.post('/:id/cancel', c.cancelRide);

module.exports = router;
