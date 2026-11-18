// ============================================================
// db.js - MySQL Database Connection Configuration
// ============================================================

// ============================================================
//Load environment variables
require('dotenv').config();
//Import MySQL package
const mysql = require('mysql2/promise');

// ---------------------------------------------------------------
// Check SSL configuration (secure communication between the backend and cloud database)
// ---------------------------------------------------------------

const useSSL = process.env.DB_SSL === 'true';
//Create database configuration
const dbConfig = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT, 10) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_DATABASE || 'job_tracker',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout: 30000,
  dateStrings: true,    // 30s — prevents hanging on slow cloud DB
  // Keep connections alive so the pool doesn't use stale closed connections
  // (important on Render free tier which sleeps between requests)
  enableKeepAlive:    true,
  keepAliveInitialDelay: 10000,       // Send keep-alive ping every 10s
  // SSL: required by Aiven, AWS RDS, PlanetScale, and most cloud MySQL providers
  ...(useSSL && {
    ssl: {
      rejectUnauthorized: false,      // Works without downloading the CA cert file
    },
  }),
};

// ---------------------------------------------------------------
// Display database details in the terminal.
// ---------------------------------------------------------------
console.log('\n🔌 Attempting MySQL connection...');
console.log(`   Host:     ${dbConfig.host}`);
console.log(`   Port:     ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User:     ${dbConfig.user}`);

// ---------------------------------------------------------------
// Create connection pool
// ---------------------------------------------------------------
let pool = null;
//Create connectDB() function
async function connectDB() {
  try {
    // Create the connection pool using mysql2/promise
    pool = mysql.createPool(dbConfig);

    // Test the connection by acquiring a connection from the pool
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully!\n');
    connection.release();

    return pool;
  } catch (err) {
    console.error('\n❌ MySQL connection failed!');
    console.error(`   Error: ${err.message}\n`);
    //Handle different database errors
    const msg = err.message.toLowerCase();
    const code = err.code || '';

      // This checks which type of error occurred
    if (code === 'ER_ACCESS_DENIED_ERROR' || msg.includes('access denied')) {
      console.error('📌 FIX — Access denied (wrong username or password):');
      console.error('   1. Check DB_USER and DB_PASSWORD in your backend/.env file');
      console.error('   2. Verify your MySQL root password in MySQL Workbench');
    } else if (code === 'ER_BAD_DB_ERROR' || msg.includes('unknown database')) {
      console.error(`📌 FIX — Database "${dbConfig.database}" does not exist:`);
      console.error('   1. Open MySQL Workbench');
      console.error('   2. Open and run database/schema.sql to create the "job_tracker" database and tables');
    } else if (code === 'ECONNREFUSED' || msg.includes('connect econnrefused')) {
      console.error('📌 FIX — Connection refused (MySQL server is not running or wrong port):');
      console.error('   1. Make sure your local MySQL service is running (e.g. Services -> MySQL80)');
      console.error(`   2. Verify that MySQL is listening on port ${dbConfig.port}`);
    } else if (code === 'ENOTFOUND' || msg.includes('getaddrinfo')) {
      console.error('📌 FIX — Host not found:');
      console.error(`   Check DB_HOST in backend/.env: "${dbConfig.host}" is not reachable.`);
    }

    console.error('\n   See README.md for full setup instructions.\n');
    process.exit(1);
  }
}
//Create getPool() function
function getPool() {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return pool;
}
//allow route files to import functions 
module.exports = { connectDB, getPool };
