const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const bidController = require('../controllers/bid.controller');

const router = express.Router();

/**
 * @swagger
 * /bids/current-cycle:
 *   get:
 *     summary: Get the single active bidding cycle
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/current-cycle', authenticate, bidController.getCurrentCycle);

/**
 * @swagger
 * /bids:
 *   post:
 *     summary: Place a blind bid in the currently active cycle
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, bidController.placeBid);

/**
 * @swagger
 * /bids/{bidId}:
 *   patch:
 *     summary: Increase an existing bid in the current cycle
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:bidId', authenticate, bidController.updateBid);

/**
 * @swagger
 * /bids/{bidId}:
 *   delete:
 *     summary: Cancel an active bid in the current cycle
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:bidId', authenticate, bidController.cancelBid);

/**
 * @swagger
 * /bids/me:
 *   get:
 *     summary: List the authenticated alumnus bids across cycles
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, bidController.listOwnBids);

/**
 * @swagger
 * /bids/status:
 *   get:
 *     summary: Get blind win or lose feedback for the current active cycle
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', authenticate, bidController.getMyCurrentBidStatus);

/**
 * @swagger
 * /bids/cycles/history:
 *   get:
 *     summary: Get processed and active cycle history with bid records
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cycles/history', authenticate, bidController.listCycleHistory);

/**
 * @swagger
 * /bids/cycles/{cycleId}:
 *   get:
 *     summary: Get one cycle and its history entries
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cycles/:cycleId', authenticate, bidController.getCycleHistoryById);

/**
 * @swagger
 * /bids/process-current-cycle:
 *   post:
 *     summary: Manually process the current cycle for local testing
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 */
router.post('/process-current-cycle', authenticate, bidController.processCurrentCycle);

module.exports = router;
