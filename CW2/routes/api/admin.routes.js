const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireJwt, requireApiRole } = require('../../middleware/apiAuth.middleware');
const adminController = require('../../controllers/api/admin.controller');

const router = express.Router();

/**
 * @swagger
 * /api/admin/api-keys:
 *   get:
 *     summary: List API keys
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API keys returned
 *       403:
 *         description: Admin role required
 */
router.get('/api-keys', requireJwt, requireApiRole('admin'), asyncHandler(adminController.listApiKeys));

/**
 * @swagger
 * /api/admin/api-keys:
 *   post:
 *     summary: Create a scoped API key
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyRequest'
 *     responses:
 *       201:
 *         description: API key created successfully
 *       403:
 *         description: Admin role required
 */
router.post('/api-keys', requireJwt, requireApiRole('admin'), asyncHandler(adminController.createApiKey));

/**
 * @swagger
 * /api/admin/api-keys/{id}/revoke:
 *   post:
 *     summary: Revoke an API key
 *     tags: [Admin]
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
 *         description: API key revoked successfully
 *       403:
 *         description: Admin role required
 */
router.post('/api-keys/:id/revoke', requireJwt, requireApiRole('admin'), asyncHandler(adminController.revokeApiKey));

/**
 * @swagger
 * /api/admin/usage:
 *   get:
 *     summary: Get API key and endpoint usage statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage dashboard data returned
 *       403:
 *         description: Admin role required
 */
router.get('/usage', requireJwt, requireApiRole('admin'), asyncHandler(adminController.usage));

module.exports = router;
