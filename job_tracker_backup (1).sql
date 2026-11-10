-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: job_tracker
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `interviews`
--

DROP TABLE IF EXISTS `interviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `user_id` int NOT NULL,
  `interview_date` date NOT NULL,
  `interview_time` time DEFAULT NULL,
  `interview_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Phone Screen',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `result` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Scheduled',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_interviews_jobid` (`job_id`),
  KEY `ix_interviews_userid` (`user_id`),
  CONSTRAINT `fk_interviews_job` FOREIGN KEY (`job_id`) REFERENCES `jobapplications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_interviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_interview_result` CHECK ((`result` in (_utf8mb4'Scheduled',_utf8mb4'Completed',_utf8mb4'Passed',_utf8mb4'Failed',_utf8mb4'Cancelled'))),
  CONSTRAINT `chk_interview_type` CHECK ((`interview_type` in (_utf8mb4'Phone Screen',_utf8mb4'Technical',_utf8mb4'HR Round',_utf8mb4'Final Round',_utf8mb4'On-site',_utf8mb4'Video Call',_utf8mb4'Other')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interviews`
--

LOCK TABLES `interviews` WRITE;
/*!40000 ALTER TABLE `interviews` DISABLE KEYS */;
INSERT INTO `interviews` VALUES (1,1,1,'2024-01-20','10:00:00','Phone Screen','Review system design basics. Prepare STAR stories.','Passed','2026-11-01 13:31:01','2026-11-01 13:31:01'),(2,1,1,'2024-01-27','14:00:00','Technical','LeetCode medium problems. Focus on arrays and strings.','Scheduled','2026-11-01 13:31:01','2026-11-01 13:31:01'),(3,7,1,'2024-01-26','11:00:00','Phone Screen','Research Airbnb tech stack. Review React performance.','Scheduled','2026-11-01 13:31:01','2026-11-01 13:31:01'),(4,12,2,'2026-11-02','10:00:00','Phone Screen',NULL,'Scheduled','2026-11-02 08:51:48','2026-11-02 08:51:48'),(5,15,2,'2026-11-04','10:30:00','Phone Screen',NULL,'Scheduled','2026-11-03 20:26:44','2026-11-03 20:27:00'),(6,13,2,'2026-11-02','11:30:00','HR Round',NULL,'Passed','2026-11-03 21:03:13','2026-11-03 21:03:47');
/*!40000 ALTER TABLE `interviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobapplications`
--

DROP TABLE IF EXISTS `jobapplications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobapplications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_date` date NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Wishlist',
  `job_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `follow_up_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_jobapplications_userid` (`user_id`),
  KEY `ix_jobapplications_status` (`status`),
  CONSTRAINT `fk_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_job_status` CHECK ((`status` in (_utf8mb4'Wishlist',_utf8mb4'Applied',_utf8mb4'Interview',_utf8mb4'Offer Received',_utf8mb4'Rejected')))
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobapplications`
--

LOCK TABLES `jobapplications` WRITE;
/*!40000 ALTER TABLE `jobapplications` DISABLE KEYS */;
INSERT INTO `jobapplications` VALUES (1,1,'Google','Software Engineer','Mountain View, CA','$120,000 - $180,000','2024-01-10','Interview','https://careers.google.com','Referral from college friend. Strong company culture.','2024-01-25','2026-11-01 13:31:01','2026-11-01 13:31:01'),(2,1,'Microsoft','Frontend Developer','Redmond, WA','$100,000 - $140,000','2024-01-12','Applied','https://careers.microsoft.com','Applied online. Great benefits package mentioned.','2024-01-27','2026-11-01 13:31:01','2026-11-01 13:31:01'),(3,1,'Amazon','Full Stack Developer','Seattle, WA','$110,000 - $160,000','2024-01-08','Offer Received','https://amazon.jobs','Received offer! Need to decide by Jan 30th.',NULL,'2026-11-01 13:31:01','2026-11-01 13:31:01'),(4,1,'Meta','React Developer','Menlo Park, CA','$130,000 - $190,000','2024-01-05','Rejected','https://metacareers.com','Got rejected after final round. Keep practicing system design.',NULL,'2026-11-01 13:31:01','2026-11-01 13:31:01'),(5,1,'Netflix','Senior JavaScript Developer','Los Gatos, CA','$150,000 - $200,000','2024-01-15','Wishlist','https://jobs.netflix.com','Dream job! Need to improve React skills before applying.','2024-02-01','2026-11-01 13:31:01','2026-11-01 13:31:01'),(6,1,'Spotify','Web Developer','New York, NY','$90,000 - $120,000','2024-01-14','Applied','https://spotify.com/jobs','Great product. Love their engineering blog.','2024-01-29','2026-11-01 13:31:01','2026-11-01 13:31:01'),(7,1,'Airbnb','Software Engineer II','San Francisco, CA','$115,000 - $155,000','2024-01-11','Interview','https://careers.airbnb.com','Technical phone screen scheduled for next week.','2024-01-26','2026-11-01 13:31:01','2026-11-01 13:31:01'),(8,1,'Twitter','Junior Developer','Remote','$75,000 - $95,000','2024-01-09','Applied','https://careers.twitter.com','Remote position - perfect for work-life balance.','2024-01-24','2026-11-01 13:31:01','2026-11-01 13:31:01'),(9,1,'Stripe','Backend Developer','San Francisco, CA','$125,000 - $170,000','2024-01-07','Rejected','https://stripe.com/jobs','Rejected after coding challenge. Practice more algorithms.',NULL,'2026-11-01 13:31:01','2026-11-01 13:31:01'),(10,1,'Shopify','JavaScript Developer','Remote','$95,000 - $125,000','2024-01-16','Wishlist','https://shopify.com/careers','Interesting stack. They use Ruby on Rails + React.','2024-02-05','2026-11-01 13:31:01','2026-11-01 13:31:01'),(11,2,'Google','Junior Web Developer','Bangalore','30000-40000','2026-10-20','Applied','https://careers.google.com','Applied online','2026-11-05','2026-11-02 08:26:07','2026-11-02 08:26:07'),(12,2,'Infosys','Software Developer','Kochi','25000-35000','2026-10-21','Interview','https://www.infosys.com/careers','Preparing for technical interview','2026-11-03','2026-11-02 08:26:07','2026-11-02 08:51:49'),(13,2,'TCS','Frontend Developer','Chennai','30000-45000','2026-10-24','Interview','https://www.tcs.com/careers','Need to apply','2026-11-10','2026-11-02 08:26:07','2026-11-03 21:03:13'),(15,2,'divinulux','Backend Developer','kochi','25000','2026-11-01','Interview',NULL,NULL,'2026-11-04','2026-11-03 20:25:04','2026-11-03 20:26:44'),(16,2,'amazon','sales executive','mumbai','32000','2026-11-03','Applied','https://eu-north-1.signin.aws.amazon.com/oauth?client_id=arn%3Aaws%3Asignin%3A%3A%3Aconsole%2Fcanvas&code_challenge=JAALpMxBbvnG7brSSaoP_qQ45xmu52rz9uhiahX2m20&code_challenge_method=SHA-256&response_type=code&redirect_uri=https%3A%2F%2Fconsole.aws.amazon.com%2Fconsole%2Fhome%3Fca-oauth-flow-id%3Dd29f%26hashArgs%3D%2523%26isauthcode%3Dtrue%26oauthStart%3D1793719586356%26state%3DhashArgsFromTB_eu-north-1_43f871b7c565a390%26utm_source%3Dchatgpt.com',NULL,'2026-11-05','2026-11-03 20:56:45','2026-11-03 20:56:45');
/*!40000 ALTER TABLE `jobapplications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Alex Johnson','test@example.com','$2b$10$rOzJqBkLzNExTGHnAHpjKuBF1QKVl7wFQ2bOXtHbBhL4Uqq3n3gWm','2026-11-01 13:31:01','2026-11-01 13:31:01'),(2,'fathima nazrin','nazrinziyad35@gmail.com','$2a$10$2p211Id.k4YR..LyeDxBhuEMO6Zc11WG2HpQhPPuI73mYt1ympZjC','2026-11-01 13:36:46','2026-11-01 13:36:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-09 16:10:20
