const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { requireJwt, requireApiRole } = require('../../middleware/apiAuth.middleware');
const { imageUpload, documentUpload } = require('../../middleware/upload.middleware');

const authController = require('../../controllers/api/auth.controller');
const profileController = require('../../controllers/api/profile.controller');
const bidController = require('../../controllers/api/bid.controller');
const publicController = require('../../controllers/api/public.controller');

const router = express.Router();

router.use(['/api-docs', '/auth', '/profile', '/bids', '/public/featured/today'], (req, res, next) => {
  req.isApiRequest = true;
  next();
});

router.get('/api-docs', (req, res) => {
  res.json({
    success: true,
    name: 'Alumni Bidding Platform API',
    routes: {
      auth: ['POST /auth/register', 'GET /auth/verify-email?token=', 'POST /auth/login', 'GET /auth/verify-token', 'POST /auth/logout', 'GET /auth/usage', 'POST /auth/forgot-password', 'POST /auth/reset-password'],
      profile: ['GET /profile/me', 'POST /profile', 'PUT /profile', 'DELETE /profile', 'POST /profile/development', 'PUT /profile/development/:id', 'DELETE /profile/development/:id'],
      bids: ['GET /bids/current-cycle', 'POST /bids', 'GET /bids/status', 'PATCH /bids/:id', 'GET /bids/me', 'DELETE /bids/:id', 'POST /bids/process-current-cycle', 'GET /bids/cycles/history', 'GET /bids/cycles/:id'],
      public: ['GET /public/featured/today']
    }
  });
});

router.post('/auth/register', asyncHandler(authController.register));
router.get('/auth/verify-email', asyncHandler(authController.verifyEmail));
router.post('/auth/verify-email', asyncHandler(authController.verifyEmail));
router.post('/auth/login', asyncHandler(authController.login));
router.get('/auth/verify-token', requireJwt, asyncHandler(authController.verifyToken));
router.post('/auth/logout', requireJwt, asyncHandler(authController.logout));
router.get('/auth/usage', requireJwt, asyncHandler(authController.usage));
router.post('/auth/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/auth/reset-password', asyncHandler(authController.resetPassword));

router.get('/profile/me', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.me));
router.post('/profile', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));
router.put('/profile', requireJwt, requireApiRole('alumni'), imageUpload.single('profileImage'), asyncHandler(profileController.updateMe));
router.delete('/profile', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteMe));
router.post('/profile/development', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.addDocument));
router.put('/profile/development/:id', requireJwt, requireApiRole('alumni'), documentUpload.single('documentFile'), asyncHandler(profileController.updateDocument));
router.delete('/profile/development/:id', requireJwt, requireApiRole('alumni'), asyncHandler(profileController.deleteDocument));

router.get('/bids/current-cycle', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.current));
router.post('/bids', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.place));
router.get('/bids/status', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.status));
router.patch('/bids/:id', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.update));
router.get('/bids/me', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.mine));
router.delete('/bids/:id', requireJwt, requireApiRole('alumni'), asyncHandler(bidController.cancel));
router.post('/bids/process-current-cycle', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.processCurrent));
router.get('/bids/cycles/history', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.history));
router.get('/bids/cycles/:id', requireJwt, requireApiRole('alumni', 'admin'), asyncHandler(bidController.cycle));

router.get('/public/featured/today', asyncHandler(publicController.alumniOfDay));

module.exports = router;
