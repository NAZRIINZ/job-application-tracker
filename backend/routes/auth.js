// ============================================================
// auth.js (routes) - Authentication Routes
// ============================================================

const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middleware/auth');
const {
    register,
    verifyEmail,
    resendVerificationEmail,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');

// Public routes (no auth required)
router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

router.post('/login',           login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// Protected routes (auth required)
router.get('/me',       authMiddleware, getMe);
router.put('/profile',  authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);

module.exports = router;
