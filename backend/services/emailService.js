// ============================================================
// emailService.js - All Email Notification Functions
// ============================================================
// Handles: Welcome, Email Verification, Password Reset, Status Update, Follow-up Reminder
// Uses nodemailer with Gmail SMTP (configured in config/email.js)
// ============================================================

const transporter = require('../config/email');

// ============================================================
// Common HTML email wrapper for consistent branding
// ============================================================
function emailTemplate(title, bodyContent) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <div style="max-width:600px; margin:0 auto; padding:20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius:12px 12px 0 0; padding:30px; text-align:center;">
          <div style="font-size:36px;">💼</div>
          <h1 style="color:#ffffff; margin:10px 0 0; font-size:22px;">JobTracker</h1>
        </div>
        <!-- Body -->
        <div style="background:#ffffff; padding:30px; border-radius:0 0 12px 12px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">${title}</h2>
          ${bodyContent}
        </div>
        <!-- Footer -->
        <div style="text-align:center; padding:20px; color:#9ca3af; font-size:12px;">
          <p>© ${new Date().getFullYear()} Job Application Tracker. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================
// 1. WELCOME EMAIL — Sent when a new user registers
// ============================================================
async function sendWelcomeEmail(email, name) {
  console.log('📧 Sending welcome email to:', email);

  try {
    const html = emailTemplate('Welcome aboard! 🎉', `
      <p style="color:#374151; line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151; line-height:1.6;">
        Thank you for registering with <strong>Job Application Tracker</strong>!
        Your account is all set up and ready to go.
      </p>
      <p style="color:#374151; line-height:1.6;">Here's what you can do now:</p>
      <ul style="color:#374151; line-height:1.8;">
        <li>📋 <strong>Track</strong> all your job applications in one place</li>
        <li>🗓️ <strong>Schedule</strong> and manage interview rounds</li>
        <li>🔔 <strong>Set reminders</strong> for follow‑up dates</li>
        <li>📊 <strong>Monitor</strong> your job search progress on the dashboard</li>
      </ul>
      <div style="text-align:center; margin:24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
           style="display:inline-block; background:#6366f1; color:#fff; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
          🚀 Start Tracking Jobs
        </a>
      </div>
      <p style="color:#6b7280; font-size:14px;">We wish you all the best in your job search!</p>
      <p style="color:#374151;">Best Regards,<br><strong>Job Application Tracker Team</strong></p>
    `);

    const info = await transporter.sendMail({
      from: { name: 'JobTracker', address: process.env.EMAIL_USER },
      to: email,
      subject: '🎉 Welcome to Job Application Tracker!',
      html,
    });

    console.log('✅ Welcome email sent! MessageID:', info.messageId);
    console.log('   Accepted recipients:', info.accepted);
    console.log('   Rejected recipients:', info.rejected);
    return true;
  } catch (error) {
    console.error('❌ Welcome email failed:', error);
    return false;
  }
}

// ============================================================
// EMAIL VERIFICATION — Sent when a new user registers or resends token
// ============================================================
async function sendVerificationEmail(email, name, verificationLink) {
  console.log('📧 Sending verification email to:', email);
  console.log('   Verification link:', verificationLink);

  try {
    const html = emailTemplate('Verify Your Email Address ✉️', `
      <p style="color:#374151; line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151; line-height:1.6;">
        Thank you for registering with <strong>Job Application Tracker</strong>!
        Please verify your email address to activate your account.
      </p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${verificationLink}"
           style="display:inline-block; background:#6366f1; color:#fff; padding:14px 36px; border-radius:8px; text-decoration:none; font-weight:600; font-size:16px;">
          Verify My Email
        </a>
      </div>
      <p style="color:#92400e; font-size:14px;">
        This verification link will expire in 24 hours and can only be used once.
      </p>
      <p style="color:#6b7280; font-size:14px;">
        If you did not create this account, you can ignore this email.
      </p>
      <p style="color:#374151;">
        Best Regards,<br>
        <strong>Job Application Tracker Team</strong>
      </p>
    `);

    const info = await transporter.sendMail({
      from: { name: 'JobTracker', address: process.env.EMAIL_USER },
      to: email,
      subject: '✉️ Verify Your JobTracker Email Address',
      html,
    });

    console.log('✅ Verification email sent! MessageID:', info.messageId);
    console.log('   Accepted recipients:', info.accepted);
    console.log('   Rejected recipients:', info.rejected);
    return true;
  } catch (error) {
    console.error('❌ Verification email failed:', error);
    return false;
  }
}

// ============================================================
// 2. PASSWORD RESET EMAIL — Sent when user requests reset
// ============================================================
async function sendPasswordResetEmail(email, name, resetLink) {
  console.log('📧 Sending password reset email to:', email);
  console.log('   Reset link:', resetLink);

  try {
    const html = emailTemplate('Reset Your Password 🔑', `
      <p style="color:#374151; line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151; line-height:1.6;">
        We received a request to reset the password for your JobTracker account.
        Click the button below to set a new password:
      </p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${resetLink}"
           style="display:inline-block; background:#6366f1; color:#fff; padding:14px 36px; border-radius:8px; text-decoration:none; font-weight:600; font-size:16px;">
          🔑 Reset My Password
        </a>
      </div>
      <div style="background:#fef3c7; border:1px solid #fbbf24; border-radius:8px; padding:14px; margin:20px 0;">
        <p style="color:#92400e; margin:0; font-size:14px;">
          ⚠️ This link will <strong>expire in 1 hour</strong> and can only be used once.
        </p>
      </div>
      <p style="color:#6b7280; font-size:14px;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;"/>
      <p style="color:#9ca3af; font-size:12px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color:#6366f1; word-break:break-all;">${resetLink}</a>
      </p>
      <p style="color:#374151;">Best Regards,<br><strong>Job Application Tracker Team</strong></p>
    `);

    const info = await transporter.sendMail({
      from: { name: 'JobTracker', address: process.env.EMAIL_USER },
      to: email,
      subject: '🔑 Reset Your JobTracker Password',
      html,
    });

    console.log('✅ Password reset email sent! MessageID:', info.messageId);
    console.log('   Accepted recipients:', info.accepted);
    console.log('   Rejected recipients:', info.rejected);
    return true;
  } catch (error) {
    console.error('❌ Password reset email failed:', error);
    return false;
  }
}

// ============================================================
// 3. STATUS UPDATE EMAIL — Sent when a job status changes
// ============================================================
async function sendStatusUpdateEmail(email, name, companyName, jobTitle, oldStatus, newStatus) {
  console.log('📧 Sending status update email to:', email);

  // Status-specific emoji and color
  const statusStyles = {
    'Wishlist':       { emoji: '⭐', color: '#6b7280', message: 'is on your wishlist' },
    'Applied':        { emoji: '📤', color: '#3b82f6', message: 'application has been submitted' },
    'Interview':      { emoji: '🗓️', color: '#f59e0b', message: 'has moved to interview stage — good luck!' },
    'Offer Received': { emoji: '🎉', color: '#10b981', message: 'received an offer — congratulations!' },
    'Rejected':       { emoji: '❌', color: '#ef4444', message: 'was not selected — keep going!' },
  };

  const style = statusStyles[newStatus] || { emoji: '📋', color: '#6b7280', message: 'status has been updated' };

  try {
    const html = emailTemplate(`Application Status Updated ${style.emoji}`, `
      <p style="color:#374151; line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151; line-height:1.6;">
        Your application at <strong>${companyName}</strong> for
        <strong>${jobTitle}</strong> ${style.message}.
      </p>
      <!-- Status change card -->
      <div style="background:#f9fafb; border-radius:10px; padding:20px; margin:20px 0; text-align:center;">
        <div style="display:inline-block; margin:0 20px;">
          <p style="color:#9ca3af; font-size:12px; margin:0 0 6px;">PREVIOUS</p>
          <span style="background:#e5e7eb; color:#374151; padding:6px 16px; border-radius:20px; font-weight:600; font-size:14px;">
            ${oldStatus}
          </span>
        </div>
        <span style="color:#9ca3af; font-size:20px; vertical-align:middle;">→</span>
        <div style="display:inline-block; margin:0 20px;">
          <p style="color:#9ca3af; font-size:12px; margin:0 0 6px;">CURRENT</p>
          <span style="background:${style.color}; color:#fff; padding:6px 16px; border-radius:20px; font-weight:600; font-size:14px;">
            ${style.emoji} ${newStatus}
          </span>
        </div>
      </div>
      <div style="text-align:center; margin:24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs"
           style="display:inline-block; background:#6366f1; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
          📋 View My Applications
        </a>
      </div>
      <p style="color:#374151;">Best Regards,<br><strong>Job Application Tracker Team</strong></p>
    `);

    const info = await transporter.sendMail({
      from: { name: 'JobTracker', address: process.env.EMAIL_USER },
      to: email,
      subject: `${style.emoji} ${companyName} — Status: ${newStatus}`,
      html,
    });

    console.log('✅ Status update email sent! MessageID:', info.messageId);
    console.log('   Accepted recipients:', info.accepted);
    console.log('   Rejected recipients:', info.rejected);
    return true;
  } catch (error) {
    console.error('❌ Status update email failed:', error);
    return false;
  }
}

// ============================================================
// 4. FOLLOW-UP REMINDER EMAIL — Sent for upcoming follow-ups
// ============================================================
async function sendFollowUpReminderEmail(email, name, jobs) {
  console.log('📧 Sending follow-up reminder email to:', email, `(${jobs.length} jobs)`);

  // Build the jobs list HTML
  const jobsListHTML = jobs.map(job => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6;">
        <strong style="color:#1e293b;">${job.company_name}</strong><br>
        <span style="color:#6b7280; font-size:13px;">${job.job_title}</span>
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; text-align:center;">
        <span style="background:#fef3c7; color:#92400e; padding:4px 10px; border-radius:12px; font-size:13px; font-weight:600;">
          ${new Date(job.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; text-align:center;">
        <span style="color:#6b7280; font-size:13px;">${job.status}</span>
      </td>
    </tr>
  `).join('');

  try {
    const html = emailTemplate(`Follow-Up Reminder 🔔 (${jobs.length} application${jobs.length > 1 ? 's' : ''})`, `
      <p style="color:#374151; line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151; line-height:1.6;">
        You have <strong>${jobs.length} job application${jobs.length > 1 ? 's' : ''}</strong>
        with follow-up dates coming up. Don't miss your chance — reach out today!
      </p>
      <!-- Jobs table -->
      <table style="width:100%; border-collapse:collapse; margin:20px 0; border:1px solid #e5e7eb; border-radius:8px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px; text-align:left; color:#6b7280; font-size:12px; text-transform:uppercase;">Company / Role</th>
            <th style="padding:10px 12px; text-align:center; color:#6b7280; font-size:12px; text-transform:uppercase;">Follow-up Date</th>
            <th style="padding:10px 12px; text-align:center; color:#6b7280; font-size:12px; text-transform:uppercase;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${jobsListHTML}
        </tbody>
      </table>
      <div style="text-align:center; margin:24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs"
           style="display:inline-block; background:#6366f1; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
          📋 View My Applications
        </a>
      </div>
      <p style="color:#6b7280; font-size:14px;">
        💡 <strong>Tip:</strong> Following up shows interest and keeps you top of mind with recruiters!
      </p>
      <p style="color:#374151;">Best Regards,<br><strong>Job Application Tracker Team</strong></p>
    `);

    const info = await transporter.sendMail({
      from: { name: 'JobTracker', address: process.env.EMAIL_USER },
      to: email,
      subject: `🔔 Reminder: ${jobs.length} follow-up${jobs.length > 1 ? 's' : ''} due soon`,
      html,
    });

    console.log('✅ Follow-up reminder email sent! MessageID:', info.messageId);
    console.log('   Accepted recipients:', info.accepted);
    console.log('   Rejected recipients:', info.rejected);
    return true;
  } catch (error) {
    console.error('❌ Follow-up reminder email failed:', error);
    return false;
  }
}

// Export all email functions
module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendStatusUpdateEmail,
  sendFollowUpReminderEmail,
};
