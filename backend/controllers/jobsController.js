// ============================================================
// jobsController.js - Handles all Job Application CRUD operations
// ============================================================
// Uses mysql2/promise with connection pooling and parameterized queries (?).
// ============================================================

const { getPool } = require('../config/db');

// Valid status values (must match the CHECK constraint in MySQL schema)
const VALID_STATUSES = ['Wishlist', 'Applied', 'Interview', 'Offer Received', 'Rejected'];

// ============================================================
// GET ALL JOBS - GET /api/jobs
// Supports search, status filter, sorting, and pagination
// ============================================================
async function getJobs(req, res) {
  try {
    const pool = getPool();

    // Read query parameters from URL
    // Example: /api/jobs?search=google&status=Applied&page=2&limit=10
    const search  = req.query.search  || '';
    const status  = req.query.status  || '';
    const page    = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit   = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const sortBy  = req.query.sortBy  || 'created_at';
    const sortDir = req.query.sortDir === 'asc' ? 'ASC' : 'DESC';

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Whitelist allowed sort columns to prevent SQL injection
    const allowedSortCols = ['application_date', 'company_name', 'job_title', 'status', 'created_at'];
    const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'created_at';

    // Build dynamic WHERE clause and params array
    // Always filter by user_id so users only see their own jobs
    let whereConditions = 'WHERE user_id = ?';
    const whereParams = [req.user.id];

    // Add search filter across company, title, and location
    if (search.trim()) {
      whereConditions += ' AND (company_name LIKE ? OR job_title LIKE ? OR location LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      whereParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add status filter if valid
    if (status && VALID_STATUSES.includes(status)) {
      whereConditions += ' AND status = ?';
      whereParams.push(status);
    }

    // Count total matching records (for frontend pagination numbers)
    const countQuery = `SELECT COUNT(*) AS total FROM JobApplications ${whereConditions}`;
    const [countRows] = await pool.execute(countQuery, whereParams);
    const totalJobs = countRows[0].total;

    // Fetch the paginated dataset using MySQL LIMIT and OFFSET
    const dataQuery = `
      SELECT
        id, company_name, job_title, location, salary,
        application_date, status, job_link, notes, follow_up_date,
        created_at, updated_at
      FROM JobApplications
      ${whereConditions}
      ORDER BY ${safeSortBy} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const [jobs] = await pool.execute(dataQuery, [...whereParams, limit, offset]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(totalJobs / limit),
        totalJobs,
        limit,
      },
    });

  } catch (err) {
    console.error('GetJobs error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
}

// ============================================================
// GET SINGLE JOB - GET /api/jobs/:id
// ============================================================
async function getJobById(req, res) {
  try {
    const pool  = getPool();
    const jobId = parseInt(req.params.id, 10);

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    const [rows] = await pool.execute(
      `SELECT
         id, company_name, job_title, location, salary,
         application_date, status, job_link, notes, follow_up_date,
         created_at, updated_at
       FROM JobApplications
       WHERE id = ? AND user_id = ?`,
      [jobId, req.user.id]
    );

    // Check if job exists and belongs to this user
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('GetJobById error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch job.' });
  }
}

// ============================================================
// CREATE JOB - POST /api/jobs
// ============================================================
async function createJob(req, res) {
  try {
    const {
      company_name,
      job_title,
      location,
      salary,
      application_date,
      status,
      job_link,
      notes,
      follow_up_date,
    } = req.body;

    // Validate required fields
    if (!company_name || !job_title || !application_date) {
      return res.status(400).json({
        success: false,
        message: 'Company name, job title, and application date are required.',
      });
    }

    // Validate status
    const jobStatus = status || 'Wishlist';
    if (!VALID_STATUSES.includes(jobStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const pool = getPool();

    // Insert new application into database
    const [result] = await pool.execute(
      `INSERT INTO JobApplications
         (user_id, company_name, job_title, location, salary,
          application_date, status, job_link, notes, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        company_name.trim(),
        job_title.trim(),
        location ? location.trim() : null,
        salary ? salary.trim() : null,
        application_date,
        jobStatus,
        job_link ? job_link.trim() : null,
        notes ? notes.trim() : null,
        follow_up_date || null,
      ]
    );

    // Retrieve the newly inserted job using result.insertId
    const newJobId = result.insertId;
    const [newJobRows] = await pool.execute(
      `SELECT id, company_name, job_title, status, application_date, created_at
       FROM JobApplications
       WHERE id = ?`,
      [newJobId]
    );

    res.status(201).json({
      success: true,
      message: 'Job application added successfully!',
      data: newJobRows[0],
    });

  } catch (err) {
    console.error('CreateJob error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create job.' });
  }
}

// ============================================================
// UPDATE JOB - PUT /api/jobs/:id
// ============================================================
async function updateJob(req, res) {
  try {
    const jobId = parseInt(req.params.id, 10);

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    const {
      company_name,
      job_title,
      location,
      salary,
      application_date,
      status,
      job_link,
      notes,
      follow_up_date,
    } = req.body;

    if (!company_name || !job_title || !application_date) {
      return res.status(400).json({
        success: false,
        message: 'Company name, job title, and application date are required.',
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const pool = getPool();

    // Verify ownership before updating
    const [existing] = await pool.execute(
      'SELECT id FROM JobApplications WHERE id = ? AND user_id = ?',
      [jobId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Update the job record (using NOW() for updated_at)
    await pool.execute(
      `UPDATE JobApplications
       SET
         company_name     = ?,
         job_title        = ?,
         location         = ?,
         salary           = ?,
         application_date = ?,
         status           = ?,
         job_link         = ?,
         notes            = ?,
         follow_up_date   = ?,
         updated_at       = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        company_name.trim(),
        job_title.trim(),
        location ? location.trim() : null,
        salary ? salary.trim() : null,
        application_date,
        status || 'Wishlist',
        job_link ? job_link.trim() : null,
        notes ? notes.trim() : null,
        follow_up_date || null,
        jobId,
        req.user.id,
      ]
    );

    res.json({ success: true, message: 'Job updated successfully!' });

  } catch (err) {
    console.error('UpdateJob error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update job.' });
  }
}

// ============================================================
// DELETE JOB - DELETE /api/jobs/:id
// ============================================================
async function deleteJob(req, res) {
  try {
    const jobId = parseInt(req.params.id, 10);

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    const pool = getPool();

    // Delete job (must match user_id)
    const [result] = await pool.execute(
      'DELETE FROM JobApplications WHERE id = ? AND user_id = ?',
      [jobId, req.user.id]
    );

    // In MySQL, result.affectedRows gives number of affected rows
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.json({ success: true, message: 'Job application deleted successfully.' });

  } catch (err) {
    console.error('DeleteJob error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete job.' });
  }
}

// ============================================================
// GET STATS - GET /api/jobs/stats
// Dashboard summary counts
// ============================================================
async function getStats(req, res) {
  try {
    const pool = getPool();

    // Summary counts by status
    const [statsRows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN status = 'Wishlist'       THEN 1 ELSE 0 END), 0) AS wishlist,
         COALESCE(SUM(CASE WHEN status = 'Applied'        THEN 1 ELSE 0 END), 0) AS applied,
         COALESCE(SUM(CASE WHEN status = 'Interview'      THEN 1 ELSE 0 END), 0) AS interviews,
         COALESCE(SUM(CASE WHEN status = 'Offer Received' THEN 1 ELSE 0 END), 0) AS offers,
         COALESCE(SUM(CASE WHEN status = 'Rejected'       THEN 1 ELSE 0 END), 0) AS rejected
       FROM JobApplications
       WHERE user_id = ?`,
      [req.user.id]
    );

    // Upcoming follow-up reminders within the next 7 days (using CURDATE() and DATE_ADD)
    const [followUpRows] = await pool.execute(
      `SELECT COUNT(*) AS upcoming_followups
       FROM JobApplications
       WHERE user_id = ?
         AND follow_up_date IS NOT NULL
         AND follow_up_date >= CURDATE()
         AND follow_up_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
      [req.user.id]
    );

    // Most recent 5 applications (using LIMIT 5)
    const [recentRows] = await pool.execute(
      `SELECT
         id, company_name, job_title, status, application_date
       FROM JobApplications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    const stats = statsRows[0];

    res.json({
      success: true,
      data: {
        total:               parseInt(stats.total, 10) || 0,
        wishlist:            parseInt(stats.wishlist, 10) || 0,
        applied:             parseInt(stats.applied, 10) || 0,
        interviews:          parseInt(stats.interviews, 10) || 0,
        offers:              parseInt(stats.offers, 10) || 0,
        rejected:            parseInt(stats.rejected, 10) || 0,
        upcoming_followups:  parseInt(followUpRows[0].upcoming_followups, 10) || 0,
        recent_applications: recentRows,
      },
    });

  } catch (err) {
    console.error('GetStats error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
}

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, getStats };
