// ============================================================
// jobs.js (routes) - Job Application Routes
// ============================================================
// Import Express
const express = require('express');
// Create a router to manage job application routes
const router  = express.Router();
// Import authentication middleware
const authMiddleware = require('../middleware/auth');
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getStats,
} = require('../controllers/jobsController');

// Get dashboard statistics
// This route must come before /:id
router.get('/stats', authMiddleware, getStats);

// GET    /api/jobs      - Get all jobs 
// POST   /api/jobs      - Create new job
router.get('/',    authMiddleware, getJobs);
router.post('/',   authMiddleware, createJob);

// GET    /api/jobs/:id  - Get one job
// PUT    /api/jobs/:id  - Update job
// DELETE /api/jobs/:id  - Delete job
router.get('/:id',    authMiddleware, getJobById);
router.put('/:id',    authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);

module.exports = router;
