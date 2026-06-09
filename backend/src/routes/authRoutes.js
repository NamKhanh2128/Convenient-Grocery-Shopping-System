const express = require('express');
const { authController } = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authController.logout);

module.exports = router;
