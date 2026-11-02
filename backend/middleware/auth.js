// ============================================================
// auth.js (middleware) - JWT Authentication Middleware
// ============================================================
// Middleware in Express is like a security guard that checks
// every request BEFORE it reaches your route handler.
//
// This middleware:
// 1. Reads the JWT token from the Authorization header
// 2. Verifies the token is valid and not expired
// 3. Adds the user info to the request object (req.user)
// 4. If invalid, sends a 401 Unauthorized response
//
// USAGE: Add this to any route that requires login:
//   router.get('/protected', authMiddleware, (req, res) => { ... })
// ============================================================

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Step 1: Get the Authorization header from the request
  // It should look like: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers['authorization'];

  // Step 2: Check if the header exists
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please log in.',
    });
  }

  // Step 3: Extract just the token part (remove "Bearer " prefix)
  // Split on space: ["Bearer", "eyJhbGci..."] → take index [1]
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Token format should be: Bearer <token>',
    });
  }

  // Step 4: Verify the token using our secret key
  try {
    // jwt.verify() decodes the token and checks:
    // - The signature is valid (wasn't tampered with)
    // - The token hasn't expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 5: Attach the decoded user data to the request
    // Now any route handler can access req.user.id, req.user.email, etc.
    req.user = decoded;

    // Step 6: Call next() to pass control to the next middleware/route handler
    next();
  } catch (err) {
    // Token is invalid or expired
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
}

module.exports = authMiddleware;
