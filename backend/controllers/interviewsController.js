// ============================================================
// interviewsController.js - Handles Interview CRUD operations
// ============================================================
// Uses mysql2/promise with connection pooling and parameterized queries (?).
// ============================================================

const { getPool } = require('../config/db');

const VALID_TYPES   = ['Phone Screen', 'Technical', 'HR Round', 'Final Round', 'On-site', 'Video Call', 'Other'];
const VALID_RESULTS = ['Scheduled', 'Completed', 'Passed', 'Failed', 'Cancelled'];

// ============================================================
// GET ALL INTERVIEWS - GET /api/interviews
// ============================================================
async function getInterviews(req, res) {
  try {
    const pool = getPool();

    const [rows] = await pool.execute(
      `SELECT
         i.id,
         i.job_id,
         i.interview_date,
         i.interview_time,
         i.interview_type,
         i.notes,
         i.result,
         i.created_at,
         j.company_name,
         j.job_title
       FROM Interviews i
       INNER JOIN JobApplications j ON i.job_id = j.id
       WHERE i.user_id = ?
       ORDER BY i.interview_date DESC, i.interview_time DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: rows });

  } catch (err) {
    console.error('GetInterviews error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch interviews.' });
  }
}

// ============================================================
// CREATE INTERVIEW - POST /api/interviews
// ============================================================
async function createInterview(req, res) {
  try {
    const { job_id, interview_date, interview_time, interview_type, notes, result } = req.body;

    if (!job_id || !interview_date) {
      return res.status(400).json({
        success: false,
        message: 'Job ID and interview date are required.',
      });
    }

    const interviewType   = interview_type || 'Phone Screen';
    const interviewResult = result         || 'Scheduled';

    if (!VALID_TYPES.includes(interviewType)) {
      return res.status(400).json({ success: false, message: 'Invalid interview type.' });
    }

    if (!VALID_RESULTS.includes(interviewResult)) {
      return res.status(400).json({ success: false, message: 'Invalid result value.' });
    }

    const pool = getPool();

    // Verify the job belongs to this user before scheduling an interview
    const [jobRows] = await pool.execute(
      'SELECT id FROM JobApplications WHERE id = ? AND user_id = ?',
      [parseInt(job_id, 10), req.user.id]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Insert the interview record
    const [insertResult] = await pool.execute(
      `INSERT INTO Interviews
         (job_id, user_id, interview_date, interview_time, interview_type, notes, result)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(job_id, 10),
        req.user.id,
        interview_date,
        interview_time || null,
        interviewType,
        notes ? notes.trim() : null,
        interviewResult,
      ]
    );

    // Retrieve the newly created interview using insertId
    const newInterviewId = insertResult.insertId;
    const [newInterviewRows] = await pool.execute(
      'SELECT * FROM Interviews WHERE id = ?',
      [newInterviewId]
    );

    // Automatically update the job application status to 'Interview' (if not already offered/rejected)
    await pool.execute(
      `UPDATE JobApplications
       SET status = 'Interview', updated_at = NOW()
       WHERE id = ? AND user_id = ? AND status NOT IN ('Offer Received', 'Rejected')`,
      [parseInt(job_id, 10), req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully!',
      data: newInterviewRows[0],
    });

  } catch (err) {
    console.error('CreateInterview error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to schedule interview.' });
  }
}

// ============================================================
// UPDATE INTERVIEW - PUT /api/interviews/:id
// ============================================================
async function updateInterview(req, res) {
  try {
    const interviewId = parseInt(req.params.id, 10);

    if (isNaN(interviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid interview ID.' });
    }

    const { interview_date, interview_time, interview_type, notes, result } = req.body;

    if (!interview_date) {
      return res.status(400).json({ success: false, message: 'Interview date is required.' });
    }

    const pool = getPool();

    // Verify ownership
    const [existing] = await pool.execute(
      'SELECT id FROM Interviews WHERE id = ? AND user_id = ?',
      [interviewId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    await pool.execute(
      `UPDATE Interviews
       SET
         interview_date = ?,
         interview_time = ?,
         interview_type = ?,
         notes          = ?,
         result         = ?,
         updated_at     = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        interview_date,
        interview_time || null,
        interview_type || 'Phone Screen',
        notes ? notes.trim() : null,
        result || 'Scheduled',
        interviewId,
        req.user.id,
      ]
    );

    res.json({ success: true, message: 'Interview updated successfully!' });

  } catch (err) {
    console.error('UpdateInterview error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update interview.' });
  }
}

// ============================================================
// DELETE INTERVIEW - DELETE /api/interviews/:id
// ============================================================
async function deleteInterview(req, res) {
  try {
    const interviewId = parseInt(req.params.id, 10);

    if (isNaN(interviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid interview ID.' });
    }

    const pool = getPool();

    const [result] = await pool.execute(
      'DELETE FROM Interviews WHERE id = ? AND user_id = ?',
      [interviewId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    res.json({ success: true, message: 'Interview deleted.' });

  } catch (err) {
    console.error('DeleteInterview error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete interview.' });
  }
}

module.exports = { getInterviews, createInterview, updateInterview, deleteInterview };
