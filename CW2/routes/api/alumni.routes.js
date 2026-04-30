const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireApiPermission } = require('../../middleware/apiKey.middleware');
const { PERMISSIONS } = require('../../config/permissions');
const profileController = require('../../controllers/api/profile.controller');

const router = express.Router();

/**
 * @swagger
 * /api/alumni:
 *   get:
 *     summary: List alumni profiles for the analytics client
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alumni profiles returned
 *       401:
 *         description: API key required or invalid
 *       403:
 *         description: API key missing read:alumni permission
 */
router.get('/', requireApiPermission(PERMISSIONS.READ_ALUMNI), asyncHandler(profileController.listAlumni));

module.exports = router;
