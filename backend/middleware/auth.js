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

// Import JWT to verify login tokens
const jwt = require('jsonwebtoken');
// Check whether the user is logged in
function authMiddleware(req, res, next) {
  // Step 1: Get the Authorization header from the request
  
  const authHeader = req.headers['authorization'];

  // Step 2: Check if the header exists
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please log in.',
    });
  }

  // Step 3: Extract just the token part 
  
  const token = authHeader.split(' ')[1];
    // Check whether the token is available
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Token format should be: Bearer <token>',
    });
  }

    // Step 4: Verify whether the token is valid
  try {
   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 5: Store the decoded user data to the request
   
    req.user = decoded;

      // Step 6: Allow the request to continue
    next();
  } catch (err) {
    //Show a message if  Token is invalid or expired
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
// Export the middleware to use in route files

module.exports = authMiddleware;
