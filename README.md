# JobTracker – Job Application Management System

## 1. About the Project

JobTracker is a full-stack web application designed to help job seekers manage and track their job applications in one place.

It provides a centralized platform where users can maintain company details, monitor application progress, schedule interviews, manage their profiles, and track their job-search activities through a dashboard.

The main goal of this application is to make the job-search process more organized and easier to manage.

## 2. Objectives

- Simplify job application tracking.
- Maintain all job-related information in one place.
- Help users monitor application progress.
- Organize upcoming and completed interviews.
- Provide a clear overview of job-search activities.
- Improve the overall job application management process.

## 3. Features

### User Authentication
- User Registration
- Secure Login
- JWT-based Authentication
- Forgot Password
- Password Reset through Email
- Protected Routes

### Job Application Management
- Add new job applications.
- View all saved applications.
- Edit existing application details.
- Delete job applications.
- Search and filter applications.
- Track application status.
- Maintain company details, job titles, links, and notes.

### Interview Management
- Schedule interviews for saved job applications.
- View upcoming and past interviews.
- Edit interview details.
- Delete interview schedules.
- View interviews in a calendar.
- Track interview dates, times, types, and results.

### Dashboard
- View job application statistics.
- Monitor application progress.
- View upcoming interviews.
- Get an overview of job-search activities.

### Profile Management
- View and update user information.
- Change account password.

### Email Notifications
- Welcome email after registration.
- Password reset email.
- Job application status update notifications.

## 4. Technologies Used

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML5, CSS3 |
| Build Tool | Vite |
| Routing | React Router |
| State Management | Context API |
| Backend | Node.js, Express.js |
| API Communication | REST API, Fetch API |
| Authentication | JSON Web Token (JWT) |
| Password Security | bcryptjs |
| Database | MySQL |
| Database Driver | mysql2 |
| Email Service | Nodemailer |
| Development Tools | Visual Studio Code, Postman, MySQL Workbench |
| Version Control | Git, GitHub |

## 5. Application Workflow

The application follows a client-server architecture.

1. The user registers or logs in through the React frontend.
2. The frontend sends requests to the Express backend.
3. The backend validates user information and communicates with the MySQL database.
4. After successful authentication, a JWT token is returned to the frontend.
5. The token is used to access protected APIs.
6. Users can manage job applications and interview schedules.
7. The dashboard displays relevant application information and statistics.

### Architecture Overview

```text
             USER
               |
               v
       REACT FRONTEND
               |
          REST API
               |
               v
       NODE.JS + EXPRESS
               |
        +------+------+
        |             |
        v             v
    MYSQL DB      NODEMAILER
                      |
                      v
                 EMAIL SERVICE
```

## 6. Project Structure

```text
job-tracker/
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── email.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jobsController.js
│   │   └── interviewsController.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── jobs.js
│   │   └── interviews.js
│   │
│   ├── services/
│   │   └── emailService.js
│   │
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   └── package.json
│
├── .env.example
└── README.md
```

*Note: The structure above shows the main project files. Update filenames and folders to match your actual repository.*

## 7. Job Application Status

JobTracker supports the following application statuses:

| Status | Description |
|---|---|
| Wishlist | Jobs saved for future applications |
| Applied | Applications already submitted |
| Interview | Applications where an interview is scheduled or in progress |
| Offer Received | Job offers received from companies |
| Rejected | Applications rejected by companies |

## 8. Database Overview

The application uses MySQL to store user and job-related information.

### Main Database Tables

| Table | Purpose |
|---|---|
| Users | Stores user account and profile information |
| JobApplications | Stores job application details |
| Interviews | Stores interview schedules and results |
| PasswordResetTokens | Stores password reset token information |

### Database Relationships

- One user can have multiple job applications.
- One job application can have multiple interviews.
- Each interview is associated with a job application and user.
- Password reset tokens are associated with user accounts.

## 9. Security Implementation

The application includes the following security measures:

- Password hashing using bcryptjs.
- JWT-based user authentication.
- Protected frontend routes.
- Backend authentication middleware.
- Parameterized SQL queries to help prevent SQL injection.
- User-specific data access through authenticated user IDs.
- Password reset tokens with expiration and usage checks.
- Environment variables for sensitive configuration.

## 10. Prerequisites

Install the following before running the application:

- Node.js
- npm
- MySQL Server
- MySQL Workbench (optional)
- Visual Studio Code (optional)
- Git (optional)

## 11. Installation and Setup

### Step 1: Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd job-tracker
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder and configure the required database, JWT, frontend, and email settings.

### Step 3: Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

### Step 4: Database Setup

1. Open MySQL Workbench.
2. Create the project database.
3. Execute the SQL schema file.
4. Verify that the required tables are created.
5. Configure the database connection in the backend environment file.

## 12. Running the Application

### Start the Backend

```bash
cd backend
npm run dev
```

### Start the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Open the frontend URL displayed in the terminal, usually:

```text
http://localhost:5173
```

## 13. API Endpoints

### Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |

### Job Application APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | Get all job applications |
| GET | `/api/jobs/:id` | Get a specific job |
| POST | `/api/jobs` | Add a new job |
| PUT | `/api/jobs/:id` | Update a job |
| DELETE | `/api/jobs/:id` | Delete a job |

### Interview APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/interviews` | Get all interviews |
| POST | `/api/interviews` | Schedule an interview |
| PUT | `/api/interviews/:id` | Update an interview |
| DELETE | `/api/interviews/:id` | Delete an interview |



## 14. Author

**Fathima Nazrin**

**Project Name:** JobTracker

**Project Type:** Full-Stack Web Application

**Domain:** Job Application Management

---

*JobTracker – Organize your job search, track your progress, and manage your career opportunities in one place.*