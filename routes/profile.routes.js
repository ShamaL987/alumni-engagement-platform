const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const profileController = require('../controllers/profile.controller');

const router = express.Router();

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get the authenticated alumnus profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, profileController.getMyProfile);

/**
 * @swagger
 * /profile:
 *   post:
 *     summary: Create or replace the authenticated alumnus profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, upload.single('profileImage'), profileController.createOrReplaceProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update the authenticated alumnus profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.put('/', authenticate, upload.single('profileImage'), profileController.updateProfile);

/**
 * @swagger
 * /profile:
 *   delete:
 *     summary: Delete the authenticated alumnus profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/', authenticate, profileController.deleteProfile);

module.exports = router;
