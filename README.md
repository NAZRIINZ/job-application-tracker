# 💼 Job Application Tracker
### A Full-Stack Web Application — Complete Beginner's Guide

---

> **Built with:** React.js · Node.js · Express.js · Microsoft SQL Server  
> **Difficulty:** Beginner-friendly  
> **Purpose:** Portfolio project demonstrating full-stack web development

---

## 📚 Table of Contents

1. [Concepts Explained](#-concepts-explained-for-beginners)
2. [Project Structure](#-project-structure)
3. [Prerequisites & Installation](#-prerequisites--installation)
4. [Database Setup](#-database-setup)
5. [Backend Setup](#-backend-setup)
6. [Frontend Setup](#-frontend-setup)
7. [Running the App](#-running-the-app)
8. [API Documentation](#-api-documentation)
9. [Testing the App](#-testing-the-app)
10. [Common Errors & Fixes](#-common-errors--fixes)
11. [How the Code Works](#-how-the-code-works)

---

## 🧠 Concepts Explained for Beginners

Before writing any code, let's understand the key concepts.

### What is HTML?
HTML (HyperText Markup Language) defines the **structure** of a web page.
Think of it as the skeleton of a house — it tells the browser what elements exist.
```html
<h1>Hello World</h1>        <!-- Heading -->
<p>This is a paragraph</p>  <!-- Paragraph -->
<button>Click me</button>    <!-- Button -->
```

### What is CSS?
CSS (Cascading Style Sheets) controls the **visual appearance** — colors, fonts, layout.
Like interior decoration for the house:
```css
h1 { color: blue; font-size: 2rem; }
button { background: green; color: white; padding: 10px; }
```

### What is JavaScript?
JavaScript adds **behavior** and **interactivity** to web pages.
Like the electricity and plumbing — it makes things actually work:
```javascript
function greet() { alert("Hello!") }
```

### What is React?
React is a JavaScript **library** for building user interfaces.
Instead of manually updating HTML, you describe what the UI *should* look like,
and React automatically updates the page when data changes.

**Key React concepts:**
- **Components**: Reusable pieces of UI (like building blocks)
- **State (useState)**: Data that can change and triggers re-renders
- **Effects (useEffect)**: Code that runs after a component renders
- **Props**: Data passed from parent to child components

### What is Node.js?
Node.js lets you run JavaScript **outside the browser**, on a server.
This means you can use JavaScript to write backend code.

### What is Express.js?
Express.js is a framework for Node.js that makes it easy to build web APIs.
An API (Application Programming Interface) is a set of endpoints your frontend
can call to get or save data.
```javascript
app.get('/api/jobs', (req, res) => {
    res.json({ jobs: [...] }) // Send JSON data to frontend
})
```

### What is SQL?
SQL (Structured Query Language) is the language for talking to databases.
```sql
SELECT * FROM Jobs WHERE user_id = 1  -- Get all jobs for user 1
INSERT INTO Jobs (company, title) VALUES ('Google', 'Engineer')
```

### What is SQL Server?
Microsoft SQL Server is a **relational database** — it stores data in tables
with rows and columns, like an advanced spreadsheet. Tables can be linked
together using foreign keys.

### What is an API?
An API is how your frontend (React) talks to your backend (Node.js).
The frontend sends HTTP requests (GET, POST, PUT, DELETE) and the backend
returns JSON data as responses.

```
Browser (React)                     Server (Node.js)
    │                                     │
    │  GET /api/jobs                      │
    │ ──────────────────────────────────> │
    │                                     │ query SQL Server
    │  { success: true, data: [...] }     │
    │ <────────────────────────────────── │
```

### What is JWT?
JWT (JSON Web Token) is how we handle login sessions.
1. User logs in with email + password
2. Server verifies credentials, creates a signed JWT token
3. Frontend stores the token in localStorage
4. Frontend sends token with every API request in the Authorization header
5. Server verifies the token on each protected request

### What is bcrypt?
bcrypt is a password hashing algorithm. When a user sets a password,
bcrypt scrambles it into an unreadable string. The original password
can never be recovered from the hash.
```
password123 → $2b$10$rOzJqBkLzNEx...  (one-way, cannot be reversed)
```

---

## 📁 Project Structure

```
job-tracker/                    ← Root project folder
├── database/
│   ├── schema.sql             ← SQL to create tables
│   └── seed.sql               ← Sample test data
│
├── backend/                   ← Node.js + Express server
│   ├── config/
│   │   └── db.js              ← SQL Server connection
│   ├── controllers/
│   │   ├── authController.js  ← Login/register logic
│   │   ├── jobsController.js  ← CRUD for job applications
│   │   └── interviewsController.js
│   ├── middleware/
│   │   └── auth.js            ← JWT verification middleware
│   ├── routes/
│   │   ├── auth.js            ← /api/auth/* routes
│   │   ├── jobs.js            ← /api/jobs/* routes
│   │   └── interviews.js      ← /api/interviews/* routes
│   ├── .env.example           ← Copy to .env and fill in values
│   ├── server.js              ← Main Express server
│   └── package.json
│
└── frontend/                  ← React + Vite application
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx   ← Global auth state
    │   ├── components/
    │   │   └── Layout.jsx        ← Sidebar, Navbar, shared UI
    │   ├── pages/
    │   │   ├── Home.jsx          ← Landing page
    │   │   ├── Login.jsx         ← Login form
    │   │   ├── Register.jsx      ← Registration form
    │   │   ├── Dashboard.jsx     ← Stats overview
    │   │   ├── JobList.jsx       ← All applications table
    │   │   ├── AddJob.jsx        ← Add job form
    │   │   ├── EditJob.jsx       ← Edit job form
    │   │   ├── Interviews.jsx    ← Interview management
    │   │   └── Profile.jsx       ← Profile settings
    │   ├── App.jsx               ← Routes definition
    │   ├── main.jsx              ← React entry point
    │   └── index.css             ← All styles
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🛠 Prerequisites & Installation

### Step 1: Install Node.js
1. Go to **https://nodejs.org**
2. Download the **LTS** (Long Term Support) version
3. Run the installer
4. Verify installation:
```powershell
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

### Step 2: Install SQL Server
Download **SQL Server Express** (free) from:
https://www.microsoft.com/en-us/sql-server/sql-server-downloads

Choose "Express" (free edition). During installation:
- Choose "Basic" installation type
- Note the instance name (usually `SQLEXPRESS`)
- Note the connection string shown at the end

### Step 3: Install SQL Server Management Studio (SSMS)
Download from: https://aka.ms/ssmsfullsetup

SSMS is a graphical tool for managing SQL Server databases.

### Step 4: Install Git (optional but recommended)
https://git-scm.com/download/win

---

## 🗄 Database Setup

### Step 1: Open SSMS
1. Open **SQL Server Management Studio**
2. In the "Connect to Server" dialog:
   - Server type: Database Engine
   - Server name: `localhost\SQLEXPRESS` (or `.\SQLEXPRESS`)
   - Authentication: Windows Authentication (or SQL Server Authentication)
3. Click **Connect**

### Step 2: Create the Database and Tables
1. Click **File → Open → File** (or press Ctrl+O)
2. Navigate to `C:\Work\job-tracker\database\schema.sql`
3. Open the file
4. Press **F5** or click **Execute** (green play button)
5. You should see: `✅ Schema setup complete! Tables: Users, JobApplications, Interviews`

### Step 3: Load Sample Data (Optional but recommended)
1. Open `C:\Work\job-tracker\database\seed.sql` in SSMS
2. Press **F5** to execute
3. You'll see: `Test Login: Email = test@example.com | Password = password123`

### Step 4: Enable TCP/IP (Required for Node.js to connect)
1. Open **SQL Server Configuration Manager**
   (Search in Windows: "SQL Server Configuration Manager")
2. Expand **SQL Server Network Configuration**
3. Click **Protocols for SQLEXPRESS**
4. Right-click **TCP/IP** → **Enable**
5. Restart SQL Server service:
   - Go to **SQL Server Services**
   - Right-click **SQL Server (SQLEXPRESS)** → **Restart**

### Step 5: Create SQL Server Login (if NOT using Windows Auth)
In SSMS, run this SQL (replace with your own username/password):
```sql
USE master;
CREATE LOGIN jobtracker_user WITH PASSWORD = 'YourStrongPassword123!';
USE JobTracker;
CREATE USER jobtracker_user FOR LOGIN jobtracker_user;
ALTER ROLE db_owner ADD MEMBER jobtracker_user;
```

---

## ⚙️ Backend Setup

### Step 1: Create the .env file
```powershell
# Navigate to backend folder
cd C:\Work\job-tracker\backend

# Copy the example file
copy .env.example .env
```

Now open `.env` in a text editor and fill in your values:
```env
PORT=5000
JWT_SECRET=my_super_secret_key_change_this_please_123456
JWT_EXPIRES_IN=7d

# For SQL Server Express with Windows Authentication:
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=JobTracker
DB_TRUSTED_CONNECTION=true

# For SQL Server Authentication (username/password):
# DB_SERVER=localhost\SQLEXPRESS
# DB_DATABASE=JobTracker
# DB_USER=jobtracker_user
# DB_PASSWORD=YourStrongPassword123!
# DB_TRUSTED_CONNECTION=false
```

### Step 2: Install Node.js packages
```powershell
cd C:\Work\job-tracker\backend
npm install
```
This installs all packages listed in `package.json`:
- `express` — web framework
- `mssql` — SQL Server driver
- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT creation/verification
- `cors` — allow cross-origin requests
- `dotenv` — load .env file
- `nodemon` — auto-restart server on code changes (dev only)

### Step 3: Test the backend connection
```powershell
npm run dev
```
You should see:
```
✅ Connected to SQL Server successfully!
   Server:   localhost\SQLEXPRESS
   Database: JobTracker
====================================
🚀 Server running on port 5000
📡 API URL: http://localhost:5000
====================================
```

If you see errors, check the [Common Errors](#-common-errors--fixes) section.

---

## 🎨 Frontend Setup

### Step 1: Install Node.js packages
```powershell
# Open a NEW terminal window (keep backend terminal running!)
cd C:\Work\job-tracker\frontend
npm install
```

### Step 2: Start the frontend dev server
```powershell
npm run dev
```
You should see:
```
  VITE v5.x.x ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🚀 Running the App

You need **two terminal windows** running simultaneously:

**Terminal 1 — Backend:**
```powershell
cd C:\Work\job-tracker\backend
npm run dev
```

**Terminal 2 — Frontend:**
```powershell
cd C:\Work\job-tracker\frontend
npm run dev
```

Then open your browser: **http://localhost:5173**

### First Time Setup
1. Click **"Create Free Account"**
2. Register with any name/email/password
3. You'll be automatically logged in and redirected to the Dashboard

### Using the Demo Account
Email: `test@example.com` | Password: `password123`
(Only works if you ran seed.sql)

---

## 📡 API Documentation

All API responses have this format:
```json
{ "success": true/false, "message": "...", "data": {...} }
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.
```json
Request body:
{ "name": "Alex", "email": "alex@example.com", "password": "secret123" }

Response (201):
{ "success": true, "token": "eyJ...", "user": { "id": 1, "name": "Alex", "email": "..." } }
```

#### POST /api/auth/login
```json
Request body:
{ "email": "alex@example.com", "password": "secret123" }

Response (200):
{ "success": true, "token": "eyJ...", "user": { "id": 1, "name": "Alex", "email": "..." } }
```

#### GET /api/auth/me
Get current user. Requires `Authorization: Bearer <token>` header.

#### PUT /api/auth/profile
Update name and email. Requires auth.

#### PUT /api/auth/password
Change password. Requires auth.
```json
{ "currentPassword": "old", "newPassword": "newpass" }
```

### Job Application Endpoints (All require auth)

#### GET /api/jobs
Get all jobs with optional filters.
```
Query parameters:
  ?search=google      → filter by company/title/location
  ?status=Applied     → filter by status
  ?page=2&limit=10    → pagination
  ?sortBy=company_name&sortDir=asc
```

#### POST /api/jobs
Create new job application.
```json
{
  "company_name": "Google",
  "job_title": "Software Engineer",
  "location": "Mountain View, CA",
  "salary": "$120,000 - $180,000",
  "application_date": "2024-01-15",
  "status": "Applied",
  "job_link": "https://careers.google.com/job/123",
  "notes": "Applied through LinkedIn",
  "follow_up_date": "2024-01-29"
}
```

#### GET /api/jobs/:id — Get single job
#### PUT /api/jobs/:id — Update job (same body as POST)
#### DELETE /api/jobs/:id — Delete job
#### GET /api/jobs/stats — Dashboard statistics

### Interview Endpoints (All require auth)

#### GET /api/interviews — Get all interviews
#### POST /api/interviews
```json
{
  "job_id": 1,
  "interview_date": "2024-01-20",
  "interview_time": "14:00",
  "interview_type": "Technical",
  "notes": "LeetCode prep needed",
  "result": "Scheduled"
}
```
#### PUT /api/interviews/:id — Update interview
#### DELETE /api/interviews/:id — Delete interview

---

## 🧪 Testing the App

### Manual Testing Checklist
1. ✅ Register a new account
2. ✅ Log in with the demo account
3. ✅ View the dashboard stats
4. ✅ Add 3 new job applications with different statuses
5. ✅ Search for a company by name
6. ✅ Filter by status "Applied"
7. ✅ Edit a job's status to "Interview"
8. ✅ Schedule an interview for that job
9. ✅ Delete an application
10. ✅ Update your profile name
11. ✅ Change your password
12. ✅ Log out and log back in
13. ✅ Try accessing /dashboard without logging in → redirected to /login

### Testing the API with curl (optional)
```powershell
# Register
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","email":"t@test.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'

# Get jobs (replace TOKEN with the token from login)
curl http://localhost:5000/api/jobs `
  -H "Authorization: Bearer TOKEN"
```

---

## 🐛 Common Errors & Fixes

### ❌ "Cannot connect to SQL Server"
**Cause:** SQL Server is not running or TCP/IP is not enabled.
**Fix:**
1. Open Services (Windows key → "Services")
2. Find "SQL Server (SQLEXPRESS)" → right-click → Start
3. Enable TCP/IP in SQL Server Configuration Manager (see Step 4 of DB setup)
4. Check your .env DB_SERVER value matches your SQL Server instance name

### ❌ "Login failed for user"
**Cause:** Wrong username/password in .env file, or user doesn't have permission.
**Fix:**
1. Double-check DB_USER and DB_PASSWORD in .env
2. Try using Windows Authentication: set DB_TRUSTED_CONNECTION=true

### ❌ "Port 5000 already in use"
**Cause:** Another program is using port 5000.
**Fix:**
```powershell
# Find what's using the port
netstat -ano | findstr :5000
# Kill that process by PID
taskkill /PID <PID> /F
```
Or change PORT in .env to 5001.

### ❌ "CORS error" in browser console
**Cause:** Frontend port doesn't match the allowed origins in server.js.
**Fix:** Add your frontend port to the cors origin array in `server.js`.

### ❌ "jwt malformed" or "invalid token"
**Cause:** The JWT_SECRET in .env changed after you logged in.
**Fix:** Log out and log back in. The old token is no longer valid.

### ❌ React page is blank / "white screen"
**Cause:** JavaScript error in a React component.
**Fix:** Open browser developer tools (F12) → Console tab → read the error message.

### ❌ "Module not found" in Node.js
**Cause:** Missing npm package.
**Fix:** Run `npm install` in the `backend` folder.

### ❌ npm install fails
**Cause:** Node version too old or network issues.
**Fix:** Update Node.js to LTS version from nodejs.org

---

## 💡 How the Code Works

### Request Flow (Trace a request from click to database)

When you click "Add Job" and submit the form:

```
1. User clicks "Save Application" in AddJob.jsx
2. React calls handleSubmit() function
3. fetch('/api/jobs', { method: 'POST', body: JSON.stringify(form) })
   └── Vite proxy forwards to http://localhost:5000/api/jobs
4. Express receives the POST request in server.js
5. Request matches: app.use('/api/jobs', jobsRoutes)
6. Router matches: router.post('/', authMiddleware, createJob)
7. authMiddleware runs first:
   └── Reads 'Authorization: Bearer eyJ...' header
   └── jwt.verify() decodes the token
   └── Sets req.user = { id: 5, name: 'Alex', email: '...' }
8. createJob controller runs:
   └── Reads req.body (company_name, job_title, etc.)
   └── Validates required fields
   └── const pool = getPool()
   └── pool.request().input('userId', sql.Int, req.user.id).query(...)
   └── SQL Server inserts the row
9. Controller sends: res.status(201).json({ success: true, data: newJob })
10. React receives the response
11. setSuccess('Application added successfully!')
12. setTimeout(() => navigate('/jobs'), 1200) → redirect to job list
```

### Authentication Flow

```
REGISTRATION:
User fills form → POST /api/auth/register
→ Validate inputs
→ Check email not already used
→ bcrypt.hash(password, 10)     ← One-way hash
→ INSERT INTO Users (name, email, hashedPassword)
→ jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '7d' })
→ Return { token, user }
→ Frontend: localStorage.setItem('token', token)
→ AuthContext: setUser(userData)
→ Navigate to /dashboard

EVERY SUBSEQUENT REQUEST:
fetch('/api/jobs', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
→ authMiddleware runs
→ jwt.verify(token, JWT_SECRET) ← Verifies & decodes
→ req.user = { id: 5, email: '...' }
→ Route handler uses req.user.id to only access that user's data
```

### Why Parameterized Queries?
This is WRONG (SQL injection vulnerable!):
```javascript
// ❌ BAD - Never do this!
const query = `SELECT * FROM Users WHERE email = '${email}'`
// Attacker enters: ' OR '1'='1' -- 
// This becomes: SELECT * FROM Users WHERE email = '' OR '1'='1' --'
// Which returns ALL users!
```

This is RIGHT (parameterized):
```javascript
// ✅ GOOD - Always use this!
pool.request()
  .input('email', sql.NVarChar, email)
  .query("SELECT * FROM Users WHERE email = @email")
// mssql automatically escapes the value - injection impossible!
```

---

## 🚀 Next Steps (After you're comfortable)

1. **Add CSV export** — download job applications as a spreadsheet
2. **Add email notifications** — using NodeMailer for follow-up reminders
3. **Improve security** — move JWT to HttpOnly cookies
4. **Add testing** — Jest for backend, React Testing Library for frontend
5. **Deploy online**:
   - Backend: Railway, Render, or Heroku
   - Frontend: Vercel or Netlify
   - Database: Azure SQL (free tier)
6. **Add more features** — salary negotiation tracker, resume versions, cover letters

---

## 📖 Learning Resources

- **React Docs**: https://react.dev (official, beginner-friendly)
- **Node.js Docs**: https://nodejs.org/docs
- **Express.js Guide**: https://expressjs.com/guide
- **SQL Server Tutorial**: https://www.w3schools.com/sql
- **mssql Package**: https://www.npmjs.com/package/mssql
- **JWT.io**: https://jwt.io (visualize JWT tokens)
- **bcrypt explanation**: https://auth0.com/blog/hashing-passwords-one-way-road-to-security

---

*Built as a beginner portfolio project. Happy coding! 🎉*
