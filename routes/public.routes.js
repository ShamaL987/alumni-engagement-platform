const express = require('express');
const publicController = require('../controllers/public.controller');

const router = express.Router();

/**
 * @swagger
 * /public/featured/today:
 *   get:
 *     summary: Get today's featured alumnus
 *     tags: [Public]
 */
router.get('/featured/today', publicController.getTodaysFeaturedAlumnus);

module.exports = router;
