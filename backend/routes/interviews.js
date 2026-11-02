// ============================================================
// interviews.js (routes) - Interview Routes
// ============================================================

const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middleware/auth');
const {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
} = require('../controllers/interviewsController');

// GET  /api/interviews       - Get all interviews
router.get('/',    authMiddleware, getInterviews);

// POST /api/interviews       - Schedule new interview
router.post('/',   authMiddleware, createInterview);

// PUT  /api/interviews/:id   - Update interview
router.put('/:id', authMiddleware, updateInterview);

// DELETE /api/interviews/:id - Delete interview
router.delete('/:id', authMiddleware, deleteInterview);

module.exports = router;
