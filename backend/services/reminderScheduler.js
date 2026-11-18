// ============================================================
// reminderScheduler.js - Daily Follow-Up Reminder Email System
// ============================================================
// Runs every 24 hours (or on server startup) to check for jobs
// with follow_up_date = today or tomorrow, and sends reminder
// emails to the respective users.
//
// Called from server.js after database connection is established.
// ============================================================

const { getPool } = require('../config/db');
const { sendFollowUpReminderEmail } = require('../services/emailService');

// How often to check for reminders (in milliseconds)
// Default: every 24 hours = 86400000 ms
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

// ============================================================
// Check all users for upcoming follow-ups and send emails
// ============================================================
async function checkAndSendReminders() {
  console.log('\n⏰ [Reminder] Checking for follow-up reminders...');

  try {
    const pool = getPool();

    // Find all jobs with follow_up_date = today, tomorrow, or day after
    // Group by user so we send one email per user (not per job)
    const [jobs] = await pool.execute(
      `SELECT 
         ja.id, ja.company_name, ja.job_title, ja.status,
         ja.follow_up_date, ja.user_id,
         u.name AS user_name, u.email AS user_email
       FROM JobApplications ja
       INNER JOIN Users u ON ja.user_id = u.id
       WHERE ja.follow_up_date IS NOT NULL
         AND ja.follow_up_date >= CURDATE()
         AND ja.follow_up_date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY)
         AND ja.status NOT IN ('Offer Received', 'Rejected')
       ORDER BY ja.user_id, ja.follow_up_date ASC`
    );

    if (jobs.length === 0) {
      console.log('   ✅ No follow-up reminders due today.');
      return;
    }

    // Group jobs by user_id
    const userJobsMap = {};
    for (const job of jobs) {
      if (!userJobsMap[job.user_id]) {
        userJobsMap[job.user_id] = {
          name:  job.user_name,
          email: job.user_email,
          jobs:  [],
        };
      }
      userJobsMap[job.user_id].jobs.push(job);
    }

    // Send one reminder email per user
    const userIds = Object.keys(userJobsMap);
    console.log(`   📋 Found ${jobs.length} follow-up(s) for ${userIds.length} user(s).`);

    for (const userId of userIds) {
      const { name, email, jobs: userJobs } = userJobsMap[userId];
      console.log(`   📧 Sending reminder to ${name} <${email}> (${userJobs.length} job(s))...`);
      await sendFollowUpReminderEmail(email, name, userJobs);
    }

    console.log('   ✅ All follow-up reminders sent!\n');

  } catch (err) {
    console.error('   ❌ [Reminder] Error:', err.message);
  }
}

// ============================================================
// Start the reminder scheduler
// ============================================================
function startReminderScheduler() {
  console.log('⏰ [Reminder] Follow-up reminder scheduler started!');
  console.log(`   Interval: Every ${CHECK_INTERVAL / 3600000} hours`);

  // Run immediately on server startup (after a short delay for DB)
  setTimeout(() => {
    checkAndSendReminders();
  }, 5000);

  // Then run every 24 hours
  setInterval(() => {
    checkAndSendReminders();
  }, CHECK_INTERVAL);
}

module.exports = { startReminderScheduler, checkAndSendReminders };
