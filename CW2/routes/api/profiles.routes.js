const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireJwt, requireApiRole } = require('../../middleware/apiAuth.middleware');
const { imageUpload, documentUpload } = require('../../middleware/upload.middleware');
const profileController = require('../../controllers/api/profile.controller');

const router = express.Router();

/**
 * @swagger
 * /api/profiles/me:
 *   get:
 *     summary: Get the authenticated alumni profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile returned
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Alumni role required
 */
router.get('/me', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.me));

/**
 * @swagger
 * /api/profiles/me:
 *   put:
 *     summary: Update the authenticated alumni profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Alumni role required
 */
router.put('/me', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));

/**
 * @swagger
 * /api/profiles/me/documents:
 *   post:
 *     summary: Add a professional development item to the authenticated alumni profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DevelopmentRequest'
 *     responses:
 *       201:
 *         description: Professional development item created
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Alumni role required
 */
router.post('/me/documents', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.addDocument));

/**
 * @swagger
 * /api/profiles/me/documents/{id}:
 *   put:
 *     summary: Update a professional development item
 *     tags: [Profiles]
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DevelopmentRequest'
 *     responses:
 *       200:
 *         description: Professional development item updated
 *       404:
 *         description: Item not found
 */
router.put('/me/documents/:id', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.updateDocument));

/**
 * @swagger
 * /api/profiles/me/documents/{id}:
 *   delete:
 *     summary: Delete a professional development item
 *     tags: [Profiles]
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
 *         description: Professional development item deleted
 *       404:
 *         description: Item not found
 */
router.delete('/me/documents/:id', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteDocument));

module.exports = router;
