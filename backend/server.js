// ============================================================
// server.js - The main Express server entry point
// ============================================================
// This is where your Node.js web server starts.
// When you run "node server.js" or "npm run dev", this file
// is the starting point that sets everything up.
//
// What this file does:
// 1. Loads environment variables (from .env file)
// 2. Creates the Express application
// 3. Sets up middleware (CORS, JSON parsing, etc.)
// 4. Connects all route files to URL paths
// 5. Connects to the MySQL database
// 6. Starts listening for incoming requests on a port
// ============================================================

// Step 1: Load .env file variables into process.env
// This MUST be the first line before anything else!
require('dotenv').config();

// Step 2: Import required packages
const express  = require('express');   // Web framework
const cors     = require('cors');      // Allow React frontend to call our API

// Step 3: Import our database connection function
const { connectDB } = require('./config/db');

// Step 4: Import all route files
const authRoutes       = require('./routes/auth');
const jobsRoutes       = require('./routes/jobs');
const interviewsRoutes = require('./routes/interviews');

// Step 5: Create the Express application
const app = express();

// ============================================================
// MIDDLEWARE SETUP
// Middleware runs on EVERY request before hitting your routes.
// Think of it as a series of checkpoints a request passes through.
// ============================================================

// CORS - Cross-Origin Resource Sharing
// By default, browsers block requests from one domain (localhost:5173)
// to another domain (localhost:5000). CORS allows this.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// JSON Parser - allows us to read req.body as a JavaScript object
// Without this, req.body would be undefined!
app.use(express.json());

// URL-encoded form data parser (for standard HTML forms)
app.use(express.urlencoded({ extended: true }));

// Request logger - prints every incoming request to the console
// Useful for debugging during development
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next(); // Don't forget to call next()!
});

// ============================================================
// ROUTES
// Map URL prefixes to route files.
// Example: /api/auth/login → routes/auth.js → authController.login
// ============================================================
app.use('/api/auth',       authRoutes);
app.use('/api/jobs',       jobsRoutes);
app.use('/api/interviews', interviewsRoutes);

// Root route - just a health check
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Job Tracker API is running!',
    version: '1.0.0',
    endpoints: {
      auth:       '/api/auth',
      jobs:       '/api/jobs',
      interviews: '/api/interviews',
    },
  });
});

// 404 handler - runs when no route matches the request URL
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// Global error handler - catches any unhandled errors
// The 4-parameter signature (err, req, res, next) tells Express
// this is an error handler, not a regular middleware.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  });
});

// ============================================================
// START THE SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

// We wrap the startup in an async function because connectDB() is async
async function startServer() {
  try {
    // Connect to database first
    await connectDB();

    // Only start the server after successful DB connection
    app.listen(PORT, () => {
      console.log('\n====================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API URL: http://localhost:${PORT}`);
      console.log('====================================\n');
    });

  } catch (err) {
    // connectDB() already logs the error and calls process.exit(1)
    // so this catch block handles any other startup errors
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Call the startup function
startServer();
