const router = require('express').Router();
const controller = require('../controllers/certification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/', verifyToken, controller.addCertification);

module.exports = router;