// ============================================================
// jobsController.js - Handles all Job Application CRUD operations
// ============================================================
// Uses mysql2/promise with connection pooling and parameterized queries (?).
// ============================================================

const { getPool } = require('../config/db');
const { sendStatusUpdateEmail } = require('../services/emailService');

// Valid status values
const VALID_STATUSES = ['Wishlist', 'Applied', 'Interview', 'Offer Received', 'Rejected'];

// ============================================================
// GET ALL JOBS - GET /api/jobs
// Supports search, status filter, sorting, and pagination
// ============================================================
async function getJobs(req, res) {
  try {
    const pool = getPool();

    // Read query parameters from URL
    
    const search  = req.query.search  || '';
      const status = req.query.status || '';
      const fromDate = req.query.fromDate || '';
      const toDate = req.query.toDate || '';
    const page    = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit   = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const sortBy  = req.query.sortBy  || 'created_at';
    const sortDir = req.query.sortDir === 'asc' ? 'ASC' : 'DESC';

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    
    //Only the allowed database columns can be used for sorting.
   //This helps prevent SQL injection through the sorting column.
    const allowedSortCols = ['application_date', 'company_name', 'job_title', 'status', 'created_at'];
    const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'created_at';

      // WHERE filters database records.
      // req.user.id gets the logged-in user's ID from the authentication middleware.
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
      // Add application date range filter
      if (fromDate) {
          whereConditions += ' AND application_date >= ?';
          whereParams.push(fromDate);
      }

      if (toDate) {
          whereConditions += ' AND application_date <= ?';
          whereParams.push(toDate);
      }

    // Count total matching records (for frontend pagination numbers)
    const countQuery = `SELECT COUNT(*) AS total FROM JobApplications ${whereConditions}`;
    const [countRows] = await pool.execute(countQuery, whereParams);
    const totalJobs = countRows[0].total;

      // Fetch job records
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
      //It copies all the values from whereParams into a new array.
    const [jobs] = await pool.execute(dataQuery, [...whereParams, limit, offset]);
      //Send response
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
      //Validate ID
    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }
   // Fetch job from database
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

      // Verify logged-in user
    const [userCheck] = await pool.execute(
      'SELECT id FROM Users WHERE id = ?',
      [req.user.id]
    );
    console.log('CreateJob → user_id from JWT:', req.user.id, '→ found in DB:', userCheck.length > 0);

    if (userCheck.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Your session is invalid — your account was not found. Please log out and register or log in again.',
      });
    }

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
    // Log the full real error to backend console 
    console.error('CreateJob error code:', err.code);
    console.error('CreateJob error msg :', err.message);
    console.error('CreateJob error sql :', err.sql);

    
    res.status(500).json({
      success: false,
      message: 'Failed to create job.',
     
      debug: {
        code:    err.code    || 'UNKNOWN',
        detail:  err.message || 'No message',
        sqlMsg:  err.sqlMessage || null,
      },
    });
  }
}


// ============================================================
// UPDATE JOB - PUT /api/jobs/:id
// ============================================================
async function updateJob(req, res) {
    try {
        const jobId = parseInt(req.params.id, 10);

        if (isNaN(jobId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job ID.',
            });
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

        // Validate required fields
        if (!company_name || !job_title) {
            return res.status(400).json({
                success: false,
                message: 'Company name and job title are required.',
            });
        }

        // Check application date only when it is included in the request
        const hasApplicationDate =
            Object.prototype.hasOwnProperty.call(req.body, 'application_date');

        const hasFollowUpDate =
            Object.prototype.hasOwnProperty.call(req.body, 'follow_up_date');

        if (hasApplicationDate && !application_date) {
            return res.status(400).json({
                success: false,
                message: 'Application date cannot be empty.',
            });
        }

        // Validate status
        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value.',
            });
        }

        const pool = getPool();

        // Verify that the job belongs to the logged-in user
        const [existing] = await pool.execute(
            `SELECT id, status, company_name, job_title
       FROM JobApplications
       WHERE id = ? AND user_id = ?`,
            [jobId, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            });
        }

        const oldStatus = existing[0].status;
        const newStatus = status || oldStatus;

        // Update job details
        await pool.execute(
            `UPDATE JobApplications
       SET
         company_name = ?,
         job_title = ?,
         location = ?,
         salary = ?,
         application_date = IF(?, ?, application_date),
         status = ?,
         job_link = ?,
         notes = ?,
         follow_up_date = IF(?, ?, follow_up_date),
         updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
            [
                company_name.trim(),
                job_title.trim(),
                location ? location.trim() : null,
                salary ? salary.trim() : null,
                hasApplicationDate,
                application_date || null,
                newStatus,
                job_link ? job_link.trim() : null,
                notes ? notes.trim() : null,
                hasFollowUpDate,
                follow_up_date || null,
                jobId,
                req.user.id,
            ]
        );

        // Send status update email if the status has changed
        if (oldStatus !== newStatus) {
            const [userRows] = await pool.execute(
                'SELECT name, email FROM Users WHERE id = ?',
                [req.user.id]
            );

            if (userRows.length > 0) {
                sendStatusUpdateEmail(
                    userRows[0].email,
                    userRows[0].name,
                    company_name.trim(),
                    job_title.trim(),
                    oldStatus,
                    newStatus
                ).catch(err =>
                    console.error('Status email error (non-blocking):', err.message)
                );
            }
        }

        return res.json({
            success: true,
            message: 'Job updated successfully!',
        });

    } catch (err) {
        console.error('UpdateJob error:', err.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to update job.',
        });
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
// Export controller functions
module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, getStats };
