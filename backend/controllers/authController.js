// ============================================================
// authController.js - Handles user registration and authentication
// ============================================================
// Uses mysql2/promise with connection pooling and parameterized queries (?).
// ============================================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');           // Built-in Node.js module for secure tokens
const { getPool } = require('../config/db');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

// ============================================================
// REGISTER - POST /api/auth/register
// Creates a new user account and sends welcome email
// ============================================================
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const pool = getPool();

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM Users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const newUserId = result.insertId;

    const [newUsers] = await pool.execute(
      'SELECT id, name, email, created_at FROM Users WHERE id = ?',
      [newUserId]
    );
    const newUser = newUsers[0];

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Send welcome email (non-blocking — don't let email failure block registration)
    sendWelcomeEmail(newUser.email, newUser.name).catch(err => {
      console.error('Welcome email error (non-blocking):', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id:    newUser.id,
        name:  newUser.name,
        email: newUser.email,
      },
    });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
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
      'SELECT id, name, email, password FROM Users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
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

    const [rows] = await pool.execute(
      'SELECT password FROM Users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE Users SET password = ?, updated_at = NOW() WHERE id = ?',
      [newHash, req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully!' });

  } catch (err) {
    console.error('ChangePassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}


// ============================================================
// FORGOT PASSWORD - POST /api/auth/forgot-password
// Generates a secure reset token and sends email
// ============================================================
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const pool = getPool();

        const normalizedEmail = email.toLowerCase().trim();

        // Find the registered user
        const [rows] = await pool.execute(
            'SELECT id, name, email FROM Users WHERE email = ?',
            [normalizedEmail]
        );

        // Do not reveal whether an email is registered
        const genericMessage =
            'If that email is registered, a reset link has been sent.';

        if (rows.length === 0) {
            return res.json({
                success: true,
                message: genericMessage
            });
        }

        const user = rows[0];

        // Generate a secure random token for the email link
        const token = crypto.randomBytes(32).toString('hex');

        // Store only the SHA-256 hash in the database
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Remove previous reset tokens for this user
        await pool.execute(
            'DELETE FROM PasswordResetTokens WHERE user_id = ?',
            [user.id]
        );

        // Set expiry to one hour using MySQL server time
        await pool.execute(
            `INSERT INTO PasswordResetTokens
       (user_id, token, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
            [user.id, tokenHash]
        );

        // Build reset link
        const frontendURL = (
            process.env.FRONTEND_URL || 'http://localhost:5173'
        ).replace(/\/+$/, '');

        const resetLink =
            `${frontendURL}/reset-password?token=${token}`;

        // Send reset email
        const emailSent = await sendPasswordResetEmail(
            user.email,
            user.name,
            resetLink
        );

        // If email sending fails, invalidate the generated token
        if (!emailSent) {
            await pool.execute(
                'DELETE FROM PasswordResetTokens WHERE token = ?',
                [tokenHash]
            );

            console.error('Password reset email could not be sent.');
        }

        // Always return the same response for privacy
        return res.json({
            success: true,
            message: genericMessage
        });

    } catch (err) {
        console.error('ForgotPassword error:', err.message);

        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
}



// ============================================================
// RESET PASSWORD - POST /api/auth/reset-password
// Verifies token and securely updates password
// ============================================================
async function resetPassword(req, res) {
    let connection;

    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required.'
            });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters.'
            });
        }

        // Hash the token received from the email URL
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const pool = getPool();

        // Start database transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Find valid, unused and non-expired token
        const [tokens] = await connection.execute(
            `SELECT id, user_id
       FROM PasswordResetTokens
       WHERE token = ?
         AND used = 0
         AND expires_at > NOW()
       FOR UPDATE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'This reset link is invalid or has expired. Please request a new one.'
            });
        }

        const resetRecord = tokens[0];

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await connection.execute(
            `UPDATE Users
       SET password = ?, updated_at = NOW()
       WHERE id = ?`,
            [hashedPassword, resetRecord.user_id]
        );

        // Invalidate all reset tokens for this user
        await connection.execute(
            `UPDATE PasswordResetTokens
       SET used = 1
       WHERE user_id = ? AND used = 0`,
            [resetRecord.user_id]
        );

        // Save all changes together
        await connection.commit();

        return res.json({
            success: true,
            message: 'Password reset successfully! You can now log in.'
        });

    } catch (err) {
        if (connection) {
            await connection.rollback().catch(() => { });
        }

        console.error('ResetPassword error:', err.message);

        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };
