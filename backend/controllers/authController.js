// ============================================================
// authController.js - Handles user registration and authentication
// ============================================================
// Uses mysql2/promise with connection pooling and parameterized queries.
// ============================================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');           // Built-in Node.js module for secure tokens
const { getPool } = require('../config/db');
const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Simple in-memory cooldown map for resend verification emails
const resendCooldown = {};

// ============================================================
// REGISTER - POST /api/auth/register
// Creates a new user account and sends verification email
// ============================================================
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const pool = getPool();
    const normalizedEmail = email.toLowerCase().trim();

    // Check whether the email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM Users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create an unverified account
    const [result] = await pool.execute(
      `INSERT INTO Users (name, email, password, email_verified)\n        VALUES (?, ?, ?, 0)`,
      [name.trim(), normalizedEmail, hashedPassword]
    );

    const newUserId = result.insertId;

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Store only the SHA‑256 hash in the database
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Remove any previous verification tokens for this user
    await pool.execute('DELETE FROM EmailVerificationTokens WHERE user_id = ?', [newUserId]);

    // Store token with a 24‑hour expiry
    await pool.execute(
      `INSERT INTO EmailVerificationTokens (user_id, token, expires_at)\n        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [newUserId, hashedToken]
    );

    // Build verification link
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendURL}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailSent = await sendVerificationEmail(
      normalizedEmail,
      name.trim(),
      verificationLink
    );

    // If email sending fails, clean up the pending account
    if (!emailSent) {
      await pool.execute('DELETE FROM EmailVerificationTokens WHERE user_id = ?', [newUserId]);
      await pool.execute('DELETE FROM Users WHERE id = ? AND email_verified = 0', [newUserId]);
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification email. Please try registering again.',
      });
    }

    // No JWT is created until the email is verified
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email and verify your account before logging in.',
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
  }
}

// ============================================================
// VERIFY EMAIL - GET /api/auth/verify-email
// ============================================================
async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is missing.',
      });
    }

    const pool = getPool();

    // Hash the token received from the email link
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find a valid, non‑expired verification token
    const [tokens] = await pool.execute(
      `SELECT evt.id, evt.user_id\n        FROM EmailVerificationTokens evt\n        WHERE evt.token = ? AND evt.expires_at > NOW()`,
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This verification link is invalid or has expired.',
      });
    }

    const verificationRecord = tokens[0];

    // Activate the user account
    await pool.execute('UPDATE Users SET email_verified = 1 WHERE id = ?', [verificationRecord.user_id]);

    // Delete the token so it cannot be reused
    await pool.execute('DELETE FROM EmailVerificationTokens WHERE id = ?', [verificationRecord.id]);

    // Send welcome email after successful verification
    const [users] = await pool.execute('SELECT id, name, email FROM Users WHERE id = ?', [verificationRecord.user_id]);
    if (users.length > 0) {
      const user = users[0];
      sendWelcomeEmail(user.email, user.name).catch(err => {
        console.error('Welcome email error:', err.message);
      });
    }

    return res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (err) {
    console.error('VerifyEmail error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying your email.',
    });
  }
}

// ============================================================
// RESEND VERIFICATION EMAIL - POST /api/auth/resend-verification
// ============================================================
async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const pool = getPool();

    // Find the user
    const [rows] = await pool.execute(
      'SELECT id, name, email_verified FROM Users WHERE email = ?',
      [normalizedEmail]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    const user = rows[0];
    if (Number(user.email_verified) === 1) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    // Rate limiting – one request per minute per email
    const now = Date.now();
    if (resendCooldown[normalizedEmail] && now - resendCooldown[normalizedEmail] < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait before requesting another verification email.' });
    }
    resendCooldown[normalizedEmail] = now;

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Remove previous tokens and store the new one (24‑hour expiry)
    await pool.execute('DELETE FROM EmailVerificationTokens WHERE user_id = ?', [user.id]);
    await pool.execute(
      `INSERT INTO EmailVerificationTokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [user.id, hashedToken]
    );

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendURL}/verify-email?token=${verificationToken}`;

    const emailSent = await sendVerificationEmail(normalizedEmail, user.name, verificationLink);
    if (!emailSent) {
      return res.status(500).json({ success: false, message: 'Failed to send verification email.' });
    }

    return res.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Resend verification error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error while resending verification email.' });
  }
}

// ============================================================
// LOGIN - POST /api/auth/login
// ============================================================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, password, email_verified FROM Users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify email status
    if (Number(user.email_verified) !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before signing in. Check your inbox for the verification link.',
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
}

// ============================================================
// GET ME - GET /api/auth/me
// ============================================================
async function getMe(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, created_at FROM Users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ============================================================
// UPDATE PROFILE - PUT /api/auth/profile
// ============================================================
async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    const pool = getPool();
    const [emailCheck] = await pool.execute(
      'SELECT id FROM Users WHERE email = ? AND id != ?',
      [email.toLowerCase().trim(), req.user.id]
    );
    if (emailCheck.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    await pool.execute(
      'UPDATE Users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), email.toLowerCase().trim(), req.user.id]
    );
    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('UpdateProfile error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ============================================================
// CHANGE PASSWORD - PUT /api/auth/password
// ============================================================
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    const pool = getPool();
    const [rows] = await pool.execute('SELECT password FROM Users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const isValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE Users SET password = ?, updated_at = NOW() WHERE id = ?', [newHash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    console.error('ChangePassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ============================================================
// FORGOT PASSWORD - POST /api/auth/forgot-password
// Generates reset token and sends email with reset link
// ============================================================
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email FROM Users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    // Always return success to avoid enumeration
    if (rows.length === 0) {
      return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    }
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const expiresAtMySQL = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
    // Delete any old tokens
    await pool.execute('DELETE FROM PasswordResetTokens WHERE user_id = ?', [user.id]);
    // Store new token
    await pool.execute(
      'INSERT INTO PasswordResetTokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAtMySQL]
    );
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendURL}/reset-password?token=${token}`;
    const emailSent = await sendPasswordResetEmail(user.email, user.name, resetLink);
    console.log('\n🔑 PASSWORD RESET REQUESTED');
    console.log(`   User  : ${user.name} <${user.email}>`);
    console.log(`   Link  : ${resetLink}`);
    console.log(`   Email : ${emailSent ? '✅ Sent' : '❌ Failed'}`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}\n`);
    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('ForgotPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
}

// ============================================================
// RESET PASSWORD - POST /api/auth/reset-password
// Verifies token and sets new password
// ============================================================
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const pool = getPool();
    const [tokens] = await pool.execute(
      `SELECT prt.id, prt.user_id, prt.expires_at\n       FROM PasswordResetTokens prt\n       WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()`,
      [token]
    );
    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid or has expired. Please request a new one.',
      });
    }
    const resetRecord = tokens[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE Users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, resetRecord.user_id]);
    await pool.execute('UPDATE PasswordResetTokens SET used = 1 WHERE id = ?', [resetRecord.id]);
    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('ResetPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
}

// Export all controller functions in a single statement
module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
