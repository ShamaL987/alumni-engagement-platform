const express = require('express');
const router = express.Router();

const degreeController = require('../controllers/degree.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// ✅ Add degree
router.post('/', verifyToken, degreeController.addDegree);

module.exports = router;