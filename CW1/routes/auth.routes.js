const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register an alumnus account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 */
router.post(
  '/register',
  authLimiter,
  [body('email').isEmail(), body('password').isString().notEmpty()],
  validate,
  authController.register
);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify email using a verification token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT access token
 *     tags: [Authentication]
 */
router.post('/login', authLimiter, authController.login);

/**
 * @swagger
 * /auth/verify-token:
 *   get:
 *     summary: Verify the current JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/verify-token', authenticate, authController.verifyToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Create a password reset token
 *     tags: [Authentication]
 */
router.post('/forgot-password', authLimiter, authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset the password using a reset token
 *     tags: [Authentication]
 */
router.post('/reset-password', authLimiter, authController.resetPassword);


/**
 * @swagger
 * /auth/usage:
 *   get:
 *     summary: Get JWT usage statistics for the authenticated alumnus
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/usage', authenticate, authController.getUsageStatistics);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout by invalidating the current JWT version
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
