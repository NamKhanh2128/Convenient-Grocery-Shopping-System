const express = require('express');
const { authController } = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { authLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/update-profile', authMiddleware, authController.updateProfile);

module.exports = router;
