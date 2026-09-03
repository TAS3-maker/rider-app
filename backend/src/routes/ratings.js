const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Rating, RideGroup, GroupMember, User } = require('../models');
const { NOTIFICATION_TYPE, GROUP_STATUS } = require('../config/constants');
const reliabilityService = require('../services/reliabilityService');
const notificationService = require('../services/notificationService');
const { initials } = require('../services/chatService');
const { mongoose } = require('../config/db');

router.use(requireAuth);

// Members of a group the caller still needs to rate (anonymous to the rated user).
router.get('/pending', async (req, res, next) => {
  try {
    const groupId = req.query.groupId;
    if (!groupId || !mongoose.isValidObjectId(groupId)) return res.status(400).json({ error: 'A valid groupId is required' });
    const members = await GroupMember.find({ group: groupId }).populate('user', 'name').lean();
    const mine = await Rating.find({ group: groupId, rater: req.user._id }).lean();
    const ratedSet = new Set(mine.map((r) => String(r.ratee)));
    const data = members
      .filter((m) => m.user && String(m.user._id) !== String(req.user._id))
      .map((m) => ({
        userId: m.user._id,
        name: m.user.name,
        initials: initials(m.user.name),
        alreadyRated: ratedSet.has(String(m.user._id)),
      }));
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

// Submit one rating for a group member.
router.post('/', async (req, res, next) => {
  try {
    const { groupId, toUser, reliabilityStars, punctualityStars, confirmed = true } = req.body || {};
    if (!groupId || !toUser) return res.status(400).json({ error: 'groupId and toUser are required' });
    if (!(reliabilityStars >= 1 && reliabilityStars <= 5) || !(punctualityStars >= 1 && punctualityStars <= 5)) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }
    if (String(toUser) === String(req.user._id)) return res.status(400).json({ error: 'You cannot rate yourself' });

    const group = await RideGroup.findById(groupId).lean();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const myMembership = await GroupMember.findOne({ group: groupId, user: req.user._id }).lean();
    if (!myMembership) return res.status(403).json({ error: 'You were not part of this ride' });

    try {
      await Rating.create({
        group: groupId,
        ride: myMembership.ride,
        rater: req.user._id,
        ratee: toUser,
        reliabilityStars,
        punctualityStars,
        confirmed: !!confirmed,
      });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: 'You already rated this rider' });
      throw err;
    }

    await reliabilityService.recomputeReliability(toUser);
    res.status(201).json({ data: { rated: true } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
