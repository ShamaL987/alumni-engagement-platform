const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireJwt, requireApiRole } = require('../../middleware/apiAuth.middleware');
const bidController = require('../../controllers/api/bid.controller');

const router = express.Router();

/**
 * @swagger
 * /api/bids/current:
 *   get:
 *     summary: Get current active bidding cycle and authenticated alumni bid status
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current cycle returned
 */
router.get('/current', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.current));

/**
 * @swagger
 * /api/bids/current:
 *   post:
 *     summary: Place a bid in the current bidding cycle
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BidRequest'
 *     responses:
 *       201:
 *         description: Bid placed successfully
 */
router.post('/current', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.place));

/**
 * @swagger
 * /api/bids/current-cycle:
 *   get:
 *     summary: Alias for current bidding cycle and alumni bid status
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current cycle returned
 */
router.get('/current-cycle', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.current));

/**
 * @swagger
 * /api/bids:
 *   post:
 *     summary: Place a blind bid
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BidRequest'
 *     responses:
 *       201:
 *         description: Bid placed successfully
 */
router.post('/', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.place));

/**
 * @swagger
 * /api/bids/status:
 *   get:
 *     summary: Get authenticated alumni current bid feedback/status
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bid status returned
 */
router.get('/status', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.status));

/**
 * @swagger
 * /api/bids/me:
 *   get:
 *     summary: List authenticated alumni bids
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Own bids returned
 */
router.get('/me', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.mine));

/**
 * @swagger
 * /api/bids/{id}:
 *   patch:
 *     summary: Increase an existing bid
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BidRequest'
 *     responses:
 *       200:
 *         description: Bid updated successfully
 */
router.patch('/:id', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.update));

/**
 * @swagger
 * /api/bids/{id}:
 *   delete:
 *     summary: Cancel an active bid
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bid cancelled successfully
 */
router.delete('/:id', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.cancel));

/**
 * @swagger
 * /api/bids/process-current-cycle:
 *   post:
 *     summary: Process the current bidding cycle
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current cycle processed successfully
 *       403:
 *         description: Alumni or admin role required
 */
router.post('/process-current-cycle', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.processCurrent));

/**
 * @swagger
 * /api/bids/cycles/history:
 *   get:
 *     summary: List processed bidding cycle history
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cycle history returned
 */
router.get('/cycles/history', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.history));

/**
 * @swagger
 * /api/bids/cycles/{id}:
 *   get:
 *     summary: Get one processed bidding cycle by ID
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cycle returned
 *       404:
 *         description: Cycle not found
 */
router.get('/cycles/:id', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.cycle));

module.exports = router;
