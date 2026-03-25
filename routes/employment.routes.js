const router = require('express').Router();
const controller = require('../controllers/employment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/', verifyToken, controller.addEmployment);

module.exports = router;