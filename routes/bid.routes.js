const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const bidController = require('../controllers/bid.controller');

const router = express.Router();

/**
 * @swagger
 * /bids:
 *   post:
 *     summary: Place a blind bid for a target date
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, bidController.placeBid);

/**
 * @swagger
 * /bids/{bidId}:
 *   patch:
 *     summary: Increase an existing bid
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:bidId', authenticate, bidController.updateBid);

/**
 * @swagger
 * /bids/{bidId}:
 *   delete:
 *     summary: Cancel an active bid
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:bidId', authenticate, bidController.cancelBid);


/**
 * @swagger
 * /bids/process-selection:
 *   post:
 *     summary: Manually process winner selection for a target date
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/process-selection', authenticate, bidController.processSelection);

/**
 * @swagger
 * /bids/me:
 *   get:
 *     summary: List the authenticated alumnus bids
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, bidController.listOwnBids);

/**
 * @swagger
 * /bids/status:
 *   get:
 *     summary: Get blind win or lose feedback for a target date
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', authenticate, bidController.getMyBidStatusForDate);

module.exports = router;
