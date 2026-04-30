const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireApiPermission } = require('../../middleware/apiKey.middleware');
const { PERMISSIONS } = require('../../config/permissions');
const analyticsController = require('../../controllers/api/analytics.controller');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics dashboard overview data
 *     tags: [Alumni Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: industrySector
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics overview returned
 *       401:
 *         description: API key required or invalid
 *       403:
 *         description: API key missing read:analytics permission
 */
router.get('/overview', requireApiPermission(PERMISSIONS.READ_ANALYTICS), asyncHandler(analyticsController.overview));

/**
 * @swagger
 * /api/analytics/export.csv:
 *   get:
 *     summary: Export filtered alumni analytics data as CSV
 *     tags: [Alumni Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: industrySector
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file returned
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: API key required or invalid
 *       403:
 *         description: API key missing read:analytics permission
 */
router.get('/export.csv', requireApiPermission(PERMISSIONS.READ_ANALYTICS), asyncHandler(analyticsController.exportCsv));

module.exports = router;
