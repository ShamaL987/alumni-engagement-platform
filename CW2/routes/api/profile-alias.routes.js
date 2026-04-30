const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireJwt, requireApiRole } = require('../../middleware/apiAuth.middleware');
const { imageUpload, documentUpload } = require('../../middleware/upload.middleware');
const profileController = require('../../controllers/api/profile.controller');

const router = express.Router();

/**
 * @swagger
 * /api/profile/me:
 *   get:
 *     summary: Backward-compatible alias to get authenticated alumni profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile returned
 */
router.get('/me', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.me));

/**
 * @swagger
 * /api/profile:
 *   post:
 *     summary: Create or update the authenticated alumni profile
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
 *         description: Profile saved successfully
 */
router.post('/', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));

/**
 * @swagger
 * /api/profile:
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
 */
router.put('/', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: Delete the authenticated alumni profile/account
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 */
router.delete('/', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteMe));

/**
 * @swagger
 * /api/profile/development:
 *   post:
 *     summary: Add a professional development item
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
 */
router.post('/development', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.addDocument));

/**
 * @swagger
 * /api/profile/development/{id}:
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
 */
router.put('/development/:id', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.updateDocument));

/**
 * @swagger
 * /api/profile/development/{id}:
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
 */
router.delete('/development/:id', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteDocument));

module.exports = router;
