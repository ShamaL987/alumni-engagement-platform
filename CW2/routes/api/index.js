const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireJwt, requireApiRole } = require('../../middleware/apiAuth.middleware');
const { requireApiPermission } = require('../../middleware/apiKey.middleware');
const { imageUpload, documentUpload } = require('../../middleware/upload.middleware');
const { PERMISSIONS } = require('../../config/permissions');

const authController = require('../../controllers/api/auth.controller');
const profileController = require('../../controllers/api/profile.controller');
const analyticsController = require('../../controllers/api/analytics.controller');
const bidController = require('../../controllers/api/bid.controller');
const publicController = require('../../controllers/api/public.controller');
const adminController = require('../../controllers/api/admin.controller');

const router = express.Router();

router.post('/auth/register', asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));
router.get('/auth/verify-email', asyncHandler(authController.verifyEmail));
router.post('/auth/verify-email', asyncHandler(authController.verifyEmail));
router.get('/auth/verify-token', requireJwt, asyncHandler(authController.verifyToken));
router.post('/auth/logout', requireJwt, asyncHandler(authController.logout));
router.get('/auth/usage', requireJwt, asyncHandler(authController.usage));
router.post('/auth/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/auth/reset-password', asyncHandler(authController.resetPassword));

router.get('/public/alumni-of-day', requireApiPermission(PERMISSIONS.READ_ALUMNI_OF_DAY), asyncHandler(publicController.alumniOfDay));
router.get('/public/featured/today', requireApiPermission(PERMISSIONS.READ_ALUMNI_OF_DAY), asyncHandler(publicController.alumniOfDay));

router.get('/profiles/me', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.me));
router.put('/profiles/me', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));
router.post('/profiles/me/documents', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.addDocument));
router.put('/profiles/me/documents/:id', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.updateDocument));
router.delete('/profiles/me/documents/:id', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteDocument));

router.get('/profile/me', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.me));
router.post('/profile', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));
router.put('/profile', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));
router.delete('/profile', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteMe));
router.post('/profile/development', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.addDocument));
router.put('/profile/development/:id', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.updateDocument));
router.delete('/profile/development/:id', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteDocument));

router.get('/bids/current', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.current));
router.post('/bids/current', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.place));
router.get('/bids/current-cycle', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.current));
router.post('/bids', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.place));
router.get('/bids/status', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.status));
router.get('/bids/me', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.mine));
router.patch('/bids/:id', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.update));
router.delete('/bids/:id', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.cancel));
router.post('/bids/process-current-cycle', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.processCurrent));
router.get('/bids/cycles/history', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.history));
router.get('/bids/cycles/:id', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.cycle));

router.get('/alumni', requireApiPermission(PERMISSIONS.READ_ALUMNI), asyncHandler(profileController.listAlumni));
router.get('/analytics/overview', requireApiPermission(PERMISSIONS.READ_ANALYTICS), asyncHandler(analyticsController.overview));
router.get('/analytics/export.csv', requireApiPermission(PERMISSIONS.READ_ANALYTICS), asyncHandler(analyticsController.exportCsv));

router.get('/admin/api-keys', requireJwt, requireApiRole('admin'), asyncHandler(adminController.listApiKeys));
router.post('/admin/api-keys', requireJwt, requireApiRole('admin'), asyncHandler(adminController.createApiKey));
router.post('/admin/api-keys/:id/revoke', requireJwt, requireApiRole('admin'), asyncHandler(adminController.revokeApiKey));
router.get('/admin/usage', requireJwt, requireApiRole('admin'), asyncHandler(adminController.usage));

module.exports = router;
