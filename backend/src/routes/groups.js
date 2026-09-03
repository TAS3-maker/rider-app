const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/groupController');

router.use(requireAuth);

router.get('/', c.browse);
router.post('/', c.create);
router.get('/:id', c.getGroup);
router.post('/:id/join', c.join);
router.post('/:id/leave', c.leave);
router.post('/:id/booker', c.setBooker);
router.post('/:id/book', c.book);
router.post('/:id/complete', c.complete);
router.post('/:id/cancel', c.cancel);
router.post('/:id/cab-cancelled', c.cabCancelled);
router.post('/:id/start', c.start);
router.post('/:id/delay', c.delay);
router.post('/:id/remove-rider', c.removeRider);

module.exports = router;
