const express = require('express');

require('./swagger.components');

const authRoutes = require('./auth.routes');
const publicRoutes = require('./public.routes');
const profilesRoutes = require('./profiles.routes');
const profileAliasRoutes = require('./profile-alias.routes');
const bidRoutes = require('./bid.routes');
const alumniRoutes = require('./alumni.routes');
const analyticsRoutes = require('./analytics.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/profiles', profilesRoutes);
router.use('/profile', profileAliasRoutes);
router.use('/bids', bidRoutes);
router.use('/alumni', alumniRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
