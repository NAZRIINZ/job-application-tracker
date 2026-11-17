// ============================================================
// auth.js (routes) - Authentication Routes
// ============================================================

// Import Express
const express = require('express');
// Create a router to manage authentication routes
const router  = express.Router();
// Import authentication middleware
const authMiddleware = require('../middleware/auth');
// Import authentication functions from the controller
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// POST /api/auth/register - Create new account (no auth required)
router.post('/register', register);

// POST /api/auth/login - Login an existing user (no auth required)
router.post('/login', login);

// GET /api/auth/me - Get current user (auth required)
router.get('/me', authMiddleware, getMe);

// PUT /api/auth/profile - Update name/email (auth required)
router.put('/profile', authMiddleware, updateProfile);

// PUT /api/auth/password - Change password (auth required)
router.put('/password', authMiddleware, changePassword);
// Export the router so server.js can use it
module.exports = router;
