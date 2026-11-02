// ============================================================
// authController.js - Handles user registration and authentication
// ============================================================
// Controllers contain the actual business logic for each route.
// Uses mysql2/promise with connection pooling and parameterized queries (?).
// ============================================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getPool } = require('../config/db');

// ============================================================
// REGISTER - POST /api/auth/register
// Creates a new user account
// ============================================================
async function register(req, res) {
  try {
    // Step 1: Get the data the user sent in the request body
    const { name, email, password } = req.body;

    // Step 2: Validate - make sure all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Step 3: Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Step 4: Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Step 5: Get database connection pool
    const pool = getPool();

    // Step 6: Check if email already exists in the database
    // We use parameterized queries (?) to prevent SQL injection!
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

    // Step 7: Hash the password using bcrypt
    // The number 10 is the salt rounds - higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 8: Insert the new user into the database
    const [result] = await pool.execute(
      'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    // In MySQL, result.insertId gives the auto-generated primary key
    const newUserId = result.insertId;

    // Fetch the newly created user record
    const [newUsers] = await pool.execute(
      'SELECT id, name, email, created_at FROM Users WHERE id = ?',
      [newUserId]
    );
    const newUser = newUsers[0];

    // Step 9: Create a JWT token for the new user
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Step 10: Send success response with token and user info
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
// Authenticates an existing user
// ============================================================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const pool = getPool();

    // Find user by email
    const [rows] = await pool.execute(
      'SELECT id, name, email, password FROM Users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    // If no user found with that email
    if (rows.length === 0) {
      // Generic error message to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];

    // Compare the entered password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Password is valid! Generate JWT token
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
// Returns current logged-in user profile
// ============================================================
async function getMe(req, res) {
  try {
    // req.user is set by authMiddleware from the verified JWT
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
// Updates user name and email
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

    // Check if new email is already taken by another account
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

module.exports = { register, login, getMe, updateProfile, changePassword };
