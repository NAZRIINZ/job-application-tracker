// ============================================================
// auth.js (routes) - Authentication Routes
// ============================================================
// Routes map HTTP methods + URLs to controller functions.
// Think of them as the "menu" of what your API can do.
// ============================================================

const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// POST /api/auth/register - Create new account (no auth required)
router.post('/register', register);

// POST /api/auth/login - Login and get token (no auth required)
router.post('/login', login);

// GET /api/auth/me - Get current user (auth required)
router.get('/me', authMiddleware, getMe);

// PUT /api/auth/profile - Update name/email (auth required)
router.put('/profile', authMiddleware, updateProfile);

// PUT /api/auth/password - Change password (auth required)
router.put('/password', authMiddleware, changePassword);

module.exports = router;
