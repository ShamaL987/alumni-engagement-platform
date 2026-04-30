/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Public
 *   - name: Profiles
 *   - name: Bids
 *   - name: Alumni Analytics
 *   - name: Admin
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     apiKeyAuth:
 *       type: http
 *       scheme: bearer
 *
 *   schemas:
 *     ApiSuccess:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *     RegisterRequest:
 *       type: object
 *       required: [email, password, role]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         role:
 *           type: string
 *           enum: [alumni, client]
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     ResetPasswordRequest:
 *       type: object
 *       required: [token, password]
 *       properties:
 *         token:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *     ProfileRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *         linkedInUrl:
 *           type: string
 *         programme:
 *           type: string
 *         graduationYear:
 *           type: integer
 *         graduationDate:
 *           type: string
 *           format: date
 *         industrySector:
 *           type: string
 *         currentJobTitle:
 *           type: string
 *         employer:
 *           type: string
 *         country:
 *           type: string
 *         city:
 *           type: string
 *         skills:
 *           type: string
 *         biography:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         profileImage:
 *           type: string
 *           format: binary
 *     DevelopmentRequest:
 *       type: object
 *       required: [title]
 *       properties:
 *         documentType:
 *           type: string
 *           enum: [degree, certification, licence, short_course, employment_evidence, other]
 *         title:
 *           type: string
 *         issuer:
 *           type: string
 *         issuedAt:
 *           type: string
 *           format: date
 *         expiresAt:
 *           type: string
 *           format: date
 *         externalUrl:
 *           type: string
 *         notes:
 *           type: string
 *         documentFile:
 *           type: string
 *           format: binary
 *     BidRequest:
 *       type: object
 *       required: [bidAmount]
 *       properties:
 *         bidAmount:
 *           type: number
 *     ApiKeyRequest:
 *       type: object
 *       required: [name, clientType]
 *       properties:
 *         name:
 *           type: string
 *         clientType:
 *           type: string
 *           enum: [analytics_dashboard, mobile_ar_app, custom]
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 */

module.exports = {};
