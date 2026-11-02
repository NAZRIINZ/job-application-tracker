-- ============================================================
-- Job Application Tracker - Database Schema (MySQL)
-- Run this script in MySQL Workbench or the MySQL command line client
-- to create the database, tables, constraints, and indexes.
-- ============================================================

-- Step 1: Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS job_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Step 2: Switch to the job_tracker database
USE job_tracker;

-- ============================================================
-- TABLE: Users
-- Stores registered user accounts.
-- Each user has a unique email address and a bcrypt hashed password.
-- Plain text passwords are never stored!
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
    id          INT AUTO_INCREMENT PRIMARY KEY,                -- Auto-incrementing unique user ID
    name        VARCHAR(100) NOT NULL,                         -- User's full name
    email       VARCHAR(255) NOT NULL UNIQUE,                  -- Email address must be unique
    password    VARCHAR(255) NOT NULL,                         -- bcrypt hashed password
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,            -- Timestamp when account was created
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Auto-updates on modification
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: JobApplications
-- Stores all job applications created by each user.
-- user_id links each application back to the Users table.
-- ============================================================
CREATE TABLE IF NOT EXISTS JobApplications (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,                             -- Foreign key referencing Users(id)
    company_name     VARCHAR(200) NOT NULL,                   -- e.g. "Google", "Microsoft"
    job_title        VARCHAR(200) NOT NULL,                   -- e.g. "Software Engineer"
    location         VARCHAR(200),                            -- e.g. "New York, NY" or "Remote"
    salary           VARCHAR(100),                            -- e.g. "$90,000 - $120,000"
    application_date DATE NOT NULL,                            -- Date application was submitted
    status           VARCHAR(50) NOT NULL DEFAULT 'Wishlist', -- Current stage in application process
    job_link         VARCHAR(500),                            -- Link to original job posting
    notes            TEXT,                                    -- Personal notes or resume tailored info
    follow_up_date   DATE,                                     -- Reminder date to follow up with recruiter
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Restrict status to valid predefined pipeline stages
    CONSTRAINT chk_job_status CHECK (status IN (
        'Wishlist',
        'Applied',
        'Interview',
        'Offer Received',
        'Rejected'
    )),

    -- Foreign key: If a user is deleted, automatically delete their job applications
    CONSTRAINT fk_jobs_user FOREIGN KEY (user_id)
        REFERENCES Users(id) ON DELETE CASCADE,

    -- Indexes for high-performance querying
    INDEX ix_jobapplications_userid (user_id),
    INDEX ix_jobapplications_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Interviews
-- Stores scheduled or completed interview rounds for a job application.
-- One job application can have multiple interview stages (phone, technical, onsite).
-- ============================================================
CREATE TABLE IF NOT EXISTS Interviews (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    job_id           INT NOT NULL,                             -- Which job application this is for
    user_id          INT NOT NULL,                             -- Which user owns this interview record
    interview_date   DATE NOT NULL,                            -- Date of interview
    interview_time   TIME,                                     -- Time of interview (e.g. 14:00:00)
    interview_type   VARCHAR(100) DEFAULT 'Phone Screen',      -- Round type
    notes            TEXT,                                     -- Interview prep notes, questions asked, etc.
    result           VARCHAR(50) DEFAULT 'Scheduled',          -- Outcome of the interview
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Restrict interview types
    CONSTRAINT chk_interview_type CHECK (interview_type IN (
        'Phone Screen',
        'Technical',
        'HR Round',
        'Final Round',
        'On-site',
        'Video Call',
        'Other'
    )),

    -- Restrict interview outcomes
    CONSTRAINT chk_interview_result CHECK (result IN (
        'Scheduled',
        'Completed',
        'Passed',
        'Failed',
        'Cancelled'
    )),

    -- Foreign keys:
    -- If a job application is deleted, delete its associated interviews
    CONSTRAINT fk_interviews_job FOREIGN KEY (job_id)
        REFERENCES JobApplications(id) ON DELETE CASCADE,

    -- If a user is deleted, delete all their interviews
    CONSTRAINT fk_interviews_user FOREIGN KEY (user_id)
        REFERENCES Users(id) ON DELETE CASCADE,

    -- Indexes for fast lookups
    INDEX ix_interviews_jobid  (job_id),
    INDEX ix_interviews_userid (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- Verify all tables were created successfully
-- ============================================================
SHOW TABLES;
