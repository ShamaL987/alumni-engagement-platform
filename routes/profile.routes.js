const router = require('express').Router();
const controller = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/', verifyToken, controller.createProfile);
router.get('/', verifyToken, controller.getProfile);

router.post('/image', verifyToken, upload.single('image'), (req, res) => {
    res.json({ file: req.file.filename });
});

module.exports = router;