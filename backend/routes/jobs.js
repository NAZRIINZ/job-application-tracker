// ============================================================
// jobs.js (routes) - Job Application Routes
// ============================================================

const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middleware/auth');
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getStats,
} = require('../controllers/jobsController');

// All job routes require authentication
// We apply authMiddleware to each route individually

// GET  /api/jobs/stats - Dashboard statistics
// IMPORTANT: This must come BEFORE /api/jobs/:id
// otherwise Express will try to treat "stats" as an ID
router.get('/stats', authMiddleware, getStats);

// GET    /api/jobs      - Get all jobs (with search/filter/pagination)
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
