-- ============================================================
-- Job Application Tracker - Sample/Seed Data (MySQL)
-- Run this AFTER running schema.sql to populate the database
-- with realistic test data so you can test the app immediately.
--
-- Test Login Credentials:
--   Email:    test@example.com
--   Password: password123
-- (The password below is already bcrypt hashed with 10 salt rounds)
-- ============================================================

USE job_tracker;

-- Clear existing data (for fresh testing)
-- Disabling foreign key checks allows truncating tables in any order
-- and automatically resets AUTO_INCREMENT counters back to 1
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Interviews;
TRUNCATE TABLE JobApplications;
TRUNCATE TABLE Users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Insert Test User (id will be 1)
-- ============================================================
INSERT INTO Users (id, name, email, password)
VALUES (
    1,
    'Alex Johnson',
    'test@example.com',
    '$2b$10$rOzJqBkLzNExTGHnAHpjKuBF1QKVl7wFQ2bOXtHbBhL4Uqq3n3gWm'
);

-- ============================================================
-- Insert Sample Job Applications (All belonging to user_id = 1)
-- ============================================================
INSERT INTO JobApplications
    (id, user_id, company_name, job_title, location, salary, application_date, status, job_link, notes, follow_up_date)
VALUES
    (1,  1, 'Google',     'Software Engineer',           'Mountain View, CA',  '$120,000 - $180,000', '2024-01-10', 'Interview',       'https://careers.google.com',   'Referral from college friend. Strong company culture.',          '2024-01-25'),
    (2,  1, 'Microsoft',  'Frontend Developer',          'Redmond, WA',        '$100,000 - $140,000', '2024-01-12', 'Applied',         'https://careers.microsoft.com','Applied online. Great benefits package mentioned.',               '2024-01-27'),
    (3,  1, 'Amazon',     'Full Stack Developer',        'Seattle, WA',        '$110,000 - $160,000', '2024-01-08', 'Offer Received',  'https://amazon.jobs',          'Received offer! Need to decide by Jan 30th.',                    NULL),
    (4,  1, 'Meta',       'React Developer',             'Menlo Park, CA',     '$130,000 - $190,000', '2024-01-05', 'Rejected',        'https://metacareers.com',      'Got rejected after final round. Keep practicing system design.',  NULL),
    (5,  1, 'Netflix',    'Senior JavaScript Developer', 'Los Gatos, CA',      '$150,000 - $200,000', '2024-01-15', 'Wishlist',        'https://jobs.netflix.com',     'Dream job! Need to improve React skills before applying.',        '2024-02-01'),
    (6,  1, 'Spotify',    'Web Developer',               'New York, NY',       '$90,000 - $120,000',  '2024-01-14', 'Applied',         'https://spotify.com/jobs',     'Great product. Love their engineering blog.',                     '2024-01-29'),
    (7,  1, 'Airbnb',     'Software Engineer II',        'San Francisco, CA',  '$115,000 - $155,000', '2024-01-11', 'Interview',       'https://careers.airbnb.com',   'Technical phone screen scheduled for next week.',                 '2024-01-26'),
    (8,  1, 'Twitter',    'Junior Developer',            'Remote',             '$75,000 - $95,000',   '2024-01-09', 'Applied',         'https://careers.twitter.com',  'Remote position - perfect for work-life balance.',                '2024-01-24'),
    (9,  1, 'Stripe',     'Backend Developer',           'San Francisco, CA',  '$125,000 - $170,000', '2024-01-07', 'Rejected',        'https://stripe.com/jobs',      'Rejected after coding challenge. Practice more algorithms.',      NULL),
    (10, 1, 'Shopify',    'JavaScript Developer',        'Remote',             '$95,000 - $125,000',  '2024-01-16', 'Wishlist',        'https://shopify.com/careers',  'Interesting stack. They use Ruby on Rails + React.',              '2024-02-05');

-- ============================================================
-- Insert Sample Interviews
-- ============================================================
INSERT INTO Interviews
    (id, job_id, user_id, interview_date, interview_time, interview_type, notes, result)
VALUES
    -- Google interviews (job_id = 1)
    (1, 1, 1, '2024-01-20', '10:00:00', 'Phone Screen', 'Review system design basics. Prepare STAR stories.', 'Passed'),
    (2, 1, 1, '2024-01-27', '14:00:00', 'Technical',    'LeetCode medium problems. Focus on arrays and strings.', 'Scheduled'),

    -- Airbnb interview (job_id = 7)
    (3, 7, 1, '2024-01-26', '11:00:00', 'Phone Screen', 'Research Airbnb tech stack. Review React performance.', 'Scheduled');

-- ============================================================
-- Verify the data was inserted correctly
-- ============================================================
SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM Users
UNION ALL
SELECT 'JobApplications' AS TableName, COUNT(*) AS RecordCount FROM JobApplications
UNION ALL
SELECT 'Interviews' AS TableName, COUNT(*) AS RecordCount FROM Interviews;

-- Preview the job applications for Alex Johnson
SELECT id, company_name, job_title, status, application_date
FROM JobApplications
WHERE user_id = 1
ORDER BY application_date DESC;
