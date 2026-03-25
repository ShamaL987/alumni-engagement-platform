const router = require('express').Router();
const controller = require('../controllers/bid.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/', verifyToken, controller.placeBid);
router.put('/', verifyToken, controller.updateBid);
router.get('/status', verifyToken, controller.getBidStatus);

module.exports = router;