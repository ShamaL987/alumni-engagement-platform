const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireJwt } = require('../../middleware/apiAuth.middleware');
const authController = require('../../controllers/api/auth.controller');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new alumni or client account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful and verification email generated
 *       400:
 *         description: Invalid input or weak password
 *       409:
 *         description: Account already exists
 */
router.post('/register', asyncHandler(authController.register));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify account email using a token query parameter
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', asyncHandler(authController.verifyEmail));

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify account email using a token in the request body
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-email', asyncHandler(authController.verifyEmail));

/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Verify the current JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid or missing JWT token
 */
router.get('/verify-token', requireJwt, asyncHandler(authController.verifyToken));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout by invalidating the current token version
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Invalid or missing JWT token
 */
router.post('/logout', requireJwt, asyncHandler(authController.logout));

/**
 * @swagger
 * /api/auth/usage:
 *   get:
 *     summary: Get authenticated user's recent API usage logs
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage logs returned
 *       401:
 *         description: Invalid or missing JWT token
 */
router.get('/usage', requireJwt, asyncHandler(authController.usage));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset token generated if the account exists
 */
router.post('/forgot-password', asyncHandler(authController.forgotPassword));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or weak password
 */
router.post('/reset-password', asyncHandler(authController.resetPassword));

module.exports = router;
