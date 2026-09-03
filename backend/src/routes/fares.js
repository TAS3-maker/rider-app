const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/fareController');

router.use(requireAuth);

router.get('/:groupId', c.get);
router.post('/:groupId', c.enter);
router.post('/:groupId/confirm', c.confirm);
router.post('/:groupId/dispute', c.dispute);

module.exports = router;
