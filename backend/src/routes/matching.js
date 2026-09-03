// Matching route — thin wrapper over the rule-based engine (see rideController.getRideMatches).
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/rideController');

router.use(requireAuth);

// GET /api/matching/candidates?rideId=... → ranked compatible groups for a ride.
router.get('/candidates', (req, res, next) => {
  req.params.id = req.query.rideId;
  return c.getRideMatches(req, res, next);
});

module.exports = router;
