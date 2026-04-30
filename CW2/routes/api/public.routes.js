const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireApiPermission } = require('../../middleware/apiKey.middleware');
const { PERMISSIONS } = require('../../config/permissions');
const publicController = require('../../controllers/api/public.controller');

const router = express.Router();

/**
 * @swagger
 * /api/public/alumni-of-day:
 *   get:
 *     summary: Get the current Alumni of the Day
 *     tags: [Public]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Featured alumnus returned
 *       401:
 *         description: API key required or invalid
 *       403:
 *         description: API key missing read:alumni_of_day permission
 *       404:
 *         description: No featured alumnus is available
 */
router.get('/alumni-of-day', requireApiPermission(PERMISSIONS.READ_ALUMNI_OF_DAY), asyncHandler(publicController.alumniOfDay));

/**
 * @swagger
 * /api/public/featured/today:
 *   get:
 *     summary: Alias endpoint for the current Alumni of the Day
 *     tags: [Public]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Featured alumnus returned
 *       401:
 *         description: API key required or invalid
 *       403:
 *         description: API key missing read:alumni_of_day permission
 *       404:
 *         description: No featured alumnus is available
 */
router.get('/featured/today', requireApiPermission(PERMISSIONS.READ_ALUMNI_OF_DAY), asyncHandler(publicController.alumniOfDay));

module.exports = router;
