const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireWebAuth, redirectIfAuthenticated, requireRole } = require('../../middleware/webAuth.middleware');
const { imageUpload, documentUpload } = require('../../middleware/upload.middleware');

const authController = require('../../controllers/web/authController');
const dashboardController = require('../../controllers/web/dashboardController');
const alumniController = require('../../controllers/web/alumniController');
const clientController = require('../../controllers/web/clientController');
const adminController = require('../../controllers/web/adminController');
const publicController = require('../../controllers/web/publicController');

const router = express.Router();

router.get('/', asyncHandler(publicController.home));
router.get('/alumni-of-day', asyncHandler(publicController.alumniOfDay));

router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, asyncHandler(authController.login));
router.get('/register', redirectIfAuthenticated, authController.showRegister);
router.post('/register', redirectIfAuthenticated, asyncHandler(authController.register));
router.post('/logout', requireWebAuth, authController.logout);

router.get('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.get('/forgot-password', redirectIfAuthenticated, authController.showForgotPassword);
router.post('/forgot-password', redirectIfAuthenticated, asyncHandler(authController.requestPasswordReset));
router.get('/reset-password', redirectIfAuthenticated, authController.showResetPassword);
router.post('/reset-password', redirectIfAuthenticated, asyncHandler(authController.resetPassword));

router.get('/dashboard', requireWebAuth, dashboardController.index);

router.get('/alumni/profile', requireRole('alumni'), asyncHandler(alumniController.profile));
router.post('/alumni/profile', requireRole('alumni'), imageUpload.single('profileImage'), asyncHandler(alumniController.updateProfile));
router.post('/alumni/profile/clear', requireRole('alumni'), asyncHandler(alumniController.clearProfile));
router.get('/alumni/bids', requireRole('alumni'), asyncHandler(alumniController.bids));
router.post('/alumni/bids', requireRole('alumni'), asyncHandler(alumniController.placeBid));
router.post('/alumni/bids/:id/cancel', requireRole('alumni'), asyncHandler(alumniController.cancelBid));
router.post('/alumni/development', requireRole('alumni'), documentUpload.single('documentFile'), asyncHandler(alumniController.addDocument));
router.post('/alumni/development/:id/update', requireRole('alumni'), documentUpload.single('documentFile'), asyncHandler(alumniController.updateDocument));
router.post('/alumni/development/:id/delete', requireRole('alumni'), asyncHandler(alumniController.deleteDocument));
router.post('/alumni/documents', requireRole('alumni'), documentUpload.single('documentFile'), asyncHandler(alumniController.addDocument));
router.delete('/alumni/documents/:id', requireRole('alumni'), asyncHandler(alumniController.deleteDocument));

router.get('/client/dashboard', requireRole('client', 'admin'), asyncHandler(clientController.dashboard));
router.get('/client/alumni', requireRole('client', 'admin'), asyncHandler(clientController.alumni));
router.get('/client/export.csv', requireRole('client', 'admin'), asyncHandler(clientController.exportCsv));
router.post('/client/presets', requireRole('client', 'admin'), asyncHandler(clientController.savePreset));
router.delete('/client/presets/:id', requireRole('client', 'admin'), asyncHandler(clientController.deletePreset));

router.get('/admin/api-keys', requireRole('admin'), asyncHandler(adminController.apiKeys));
router.post('/admin/api-keys', requireRole('admin'), asyncHandler(adminController.createApiKey));
router.post('/admin/api-keys/:id/revoke', requireRole('admin'), asyncHandler(adminController.revokeApiKey));
router.get('/admin/usage', requireRole('admin'), asyncHandler(adminController.usage));

module.exports = router;
