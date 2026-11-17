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

// Step 1: Load environment variables
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
// Configure CORS to allow requests from the frontend

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

// Read JSON data sent from the frontend
app.use(express.json());

// Read form data sent through HTML forms
app.use(express.urlencoded({ extended: true }));

// Log every incoming request with its time, method and URL
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().slice(11, 19); 
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next(); 
});

//// Connect the URL to the related route file
app.use('/api/auth',       authRoutes);
app.use('/api/jobs',       jobsRoutes);
app.use('/api/interviews', interviewsRoutes);

// Check whether the backend server is running
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

// Check database tables and registered users
app.get('/api/debug/tables', async (req, res) => {
  try {
    const { getPool } = require('./config/db');
    const pool = getPool();
    const [tables]  = await pool.execute('SHOW TABLES');
    const tableList = tables.map(r => Object.values(r)[0]);

    // Show all users (id + email )
    const [users] = await pool.execute('SELECT id, name, email, created_at FROM Users');

    // Show table_names case-sensitivity setting
    const [caseVar] = await pool.execute("SHOW VARIABLES LIKE 'lower_case_table_names'");
      // Send the database details as a response
    res.json({
      success: true,
      database: process.env.DB_DATABASE,
      tables: tableList,
      users: users,
      lower_case_table_names: caseVar[0]?.Value || 'unknown',
    });
  } catch (err) {
      // Send an error message if something goes wrong
    res.status(500).json({ success: false, error: err.message, code: err.code });
  }
});

// Show an error when the requested URL does not exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// Handle errors that occur in the server
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    // Send an error response to the frontend
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  });
});

// ============================================================
// START THE BACKEND SERVER
// ============================================================
// Get the port number from the environment file
const PORT = process.env.PORT || 5000;

// Connect to the database and start the server
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
      // Display an error if the server fails to start
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Run the function to start the server
startServer();
