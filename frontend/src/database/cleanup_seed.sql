-- ============================================================
-- Cleanup: Remove seed/demo data so real users start fresh
-- Run this in MySQL Workbench
-- ============================================================

USE job_tracker;

-- Step 1: Delete all seed interviews and jobs for test user
DELETE FROM Interviews      WHERE user_id IN (SELECT id FROM Users WHERE email = 'test@example.com');
DELETE FROM JobApplications WHERE user_id IN (SELECT id FROM Users WHERE email = 'test@example.com');

-- Step 2: Delete the demo test user itself
DELETE FROM Users WHERE email = 'test@example.com';

-- Step 3: Also clear the PasswordResetTokens for test user (if any)
-- (These auto-delete via CASCADE, so this is just a safety check)
DELETE FROM PasswordResetTokens WHERE user_id NOT IN (SELECT id FROM Users);

-- Step 4: Verify - should now only show REAL user accounts
SELECT id, name, email, created_at FROM Users;

-- Step 5: Verify - should only show jobs belonging to real users
SELECT ja.id, u.email, ja.company_name, ja.status
FROM JobApplications ja
JOIN Users u ON ja.user_id = u.id
ORDER BY u.id;
