// Admin routes. Phase 0: session/layout wiring only (role === admin enforced).
const router = require('express').Router();
const { adminAuth } = require('../middleware/adminAuth');
const { User, Ride, RideGroup, TravelEvent } = require('../models');
const { RIDE_STATUS, GROUP_STATUS, ROLES } = require('../config/constants');

router.use(adminAuth);

// GET /api/admin/health
router.get('/health', (req, res) => res.json({ ok: true, admin: req.user.toPublic() }));

// GET /api/admin/stats — dashboard overview (real counts for layout wiring)
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalRides,
      activeRides,
      completedRides,
      cancelledRides,
      activeGroups,
      upcomingEvents,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
      Ride.countDocuments({}),
      Ride.countDocuments({ status: { $in: [RIDE_STATUS.OPEN, RIDE_STATUS.MATCHED, RIDE_STATUS.GROUPED, RIDE_STATUS.CONFIRMED, RIDE_STATUS.IN_PROGRESS] } }),
      Ride.countDocuments({ status: RIDE_STATUS.COMPLETED }),
      Ride.countDocuments({ status: RIDE_STATUS.CANCELLED }),
      RideGroup.countDocuments({ status: { $in: [GROUP_STATUS.OPEN, GROUP_STATUS.NEARLY_FULL, GROUP_STATUS.FULL, GROUP_STATUS.CONFIRMED, GROUP_STATUS.IN_PROGRESS] } }),
      TravelEvent.countDocuments({ visible: true, startDate: { $gte: new Date() } }),
    ]);
    res.json({
      totalStudents,
      activeStudents,
      totalRides,
      activeRides,
      completedRides,
      cancelledRides,
      activeGroups,
      upcomingEvents,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
