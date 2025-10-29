-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: mysql94
-- ------------------------------------------------------
-- Server version	9.4.0

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
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `attempts` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_email_created` (`email`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
INSERT INTO `otp_verifications` VALUES (1,'ttorfidoo001@gmail.com','$2b$12$S6EnJ6U/mT3oJ8SwpDHLneGFpgz6DV1IXjb1N6fegdlUEIFTh6lf.','2025-09-26 18:49:53',0,'2025-09-26 18:44:53',1),(2,'ahmedammad2006@gmail.com','$2b$12$TdRbk1LiqM8/N9JYbmnO6.L.o.cD6LHpl6JnamJGOaJOOXzyoZGUu','2025-09-26 18:55:12',5,'2025-09-26 18:50:12',1),(3,'ahmedammad2006@gmail.com','$2b$12$khriaGuWvPJXSkdTOxga/e19WJd7u6bwMF16zaRm2P13JTKvR9Sga','2025-09-26 18:56:24',0,'2025-09-26 18:51:23',1),(4,'ahmedammad@gmail.com','$2b$12$3Pg79Kpn69aVGeo.Q9JEsufH1boxW/vSEliQyZfp4dOyXuJMXHWnK','2025-09-26 19:04:01',1,'2025-09-26 18:59:01',0),(5,'ahmedammad2006@gmail.com','$2b$12$UawSrZE.M8apOJl8Ev1Die8k90TmkWPhDREigbgu7A6zuvw0noWgO','2025-09-26 19:31:09',0,'2025-09-26 19:26:08',1),(6,'ammad@gmail.com','$2b$12$IRbKGYxxv1n0kIMXsWdHP.HOsG2DHFu7eUXDti8kwmTrkiqn1n.eq','2025-09-28 13:49:58',0,'2025-09-28 13:44:57',0),(7,'ammadshifa2006@gmail.com','$2b$12$dzQIlXWkJOclVj/2epF.1uN4lfHURYfeqa5f55nXqZmb/8U51YpaK','2025-09-28 13:50:59',0,'2025-09-28 13:45:58',1),(8,'ammadshifa2006@gmail.com','$2b$12$cMcVP42Ipi6POPC65QoKluql0xn8zx9lkdFUWNBdrnJGg1llnZpgy','2025-09-28 14:03:48',0,'2025-09-28 13:58:47',1),(9,'ammadshifa2006@gmail.com','$2b$12$JxedXPCZ1iMiiQBnrmtsieJdSYDNLJ/H4vY7.cXtB91T6894rib0O','2025-09-28 14:14:59',0,'2025-09-28 14:09:58',1),(10,'ammadshifa2006@gmail.com','$2b$12$05dKqGpTA8gywsSMvHxbQu14z5RmigmQV0wCK83q/KjCquGKUcWL6','2025-09-28 14:16:51',0,'2025-09-28 14:11:50',1),(11,'ammadshifa2006@gmail.com','$2b$12$Cq6OCclzgiVDeyfR2kQn0u5bjfr.Ny/w9t/7IIuPOIPPyjIVGclii','2025-09-28 14:22:08',0,'2025-09-28 14:17:08',1),(12,'ammadshifa2006@gmail.com','$2b$12$v4XTBfzUqgc8d1nQ3lyNxupkaLoh0wNWrnogQlMwUY1vR4YzEEuU.','2025-09-28 14:28:10',0,'2025-09-28 14:23:10',1),(13,'ttorfidoo001@gmail.com','$2b$12$SI40s43lKe70HKP1BXWhMODIlAvP9eYwqlh15FjFgT3Fzs.Heso6S','2025-09-28 14:30:48',0,'2025-09-28 14:25:48',1),(14,'exxtraa10@gmail.com','$2b$12$YKte/jWo.K9k/eD11hn2hed6r2H83EXakCQ9j8Ysp26tgDDtNRA7W','2025-09-29 22:56:00',0,'2025-09-29 22:51:00',1),(15,'malikammad12789@gmail.com','$2b$12$P2FoNaG7feuD0wUQ3DaAZ.YuYcS4IzZsta/ArD7Bww9KWifoSCjdm','2025-09-29 22:59:54',0,'2025-09-29 22:54:54',1),(16,'askenazvincent10@gmail.com','$2b$12$ahE7pvla8ZTG7A7.IkEaXuw1pKbmDbXIGwmBWqTkkusg3ZRm7ui5y','2025-10-04 19:25:09',0,'2025-10-04 19:20:08',1),(17,'codeveilstudio@gmail.com','$2b$12$jNP.A.UW5n.OFdvgd.8M0uOOQyjWz5gclL2lEtLXHRa1Zyn/QKpHe','2025-10-04 19:31:35',0,'2025-10-04 19:26:34',1);
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending_signups`
--

DROP TABLE IF EXISTS `pending_signups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_signups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `role` enum('contractor','technician','supplier','consultant','admin') NOT NULL DEFAULT 'contractor',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_signups`
--

LOCK TABLES `pending_signups` WRITE;
/*!40000 ALTER TABLE `pending_signups` DISABLE KEYS */;
INSERT INTO `pending_signups` VALUES (3,'ahmedammad@gmail.com','Ahmed','$2b$12$NdaPFIbDDr0HD8N7/GDCnufX/dycRK0AmmZGa4iPpmXRG1Ievm3Z2','2025-09-26 18:59:00','contractor'),(5,'ammad@gmail.com','Ahmed','$2b$12$NwNLJ7En1oUpJKOSSxAbTOy/XssOdP/wep/ufcLEfprTdyinhdv1i','2025-09-28 13:44:57','supplier');
/*!40000 ALTER TABLE `pending_signups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('contractor','technician','supplier','consultant','admin') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `isBan` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Ahmed','ttorfidoo001@gmail.com','$2b$12$Tt4jkMP1Q2PVjCDR4Jx4VeKvZXdg4ZNTGosiTa3B/Kwivl5GunIPC','contractor',1,'2025-09-26 13:45:40',0),(2,'Ahmed','ahmedammad2006@gmail.com','$2b$12$REKbKQ4U2gJSeBKdtwGB8elQlPG07vw2C3bEkt9YxtR/pWWmLniDu','contractor',1,'2025-09-26 14:26:48',0),(3,'Ahmed','ammadshifa2006@gmail.com','$2b$12$z5AAd8p9RP.Si6E0CVIwneKbPt3l..Ll2V733yo4opbE18OB4ouZu','technician',1,'2025-09-28 08:59:24',0),(5,'System Administrator','admin@example.com','$2b$12$soA1NV06fvsIgWjj.02ZsuxF3hEEegwfVSd0FDm88dlis2mXRijBK','admin',1,'2025-09-28 10:43:12',0),(6,'Ammad','exxtraa10@gmail.com','$2b$12$Vqr5zslKWfC5/HJkxfmW3ekqE7rm/xMihW4OCOFkHUo0ARLG0BAfO','contractor',1,'2025-09-29 17:51:30',1),(7,'Ahmed','malikammad12789@gmail.com','$2b$12$rhQQuA38fSch9ULXGIzPC.K8ddq0E.7gI7TabSE3VdcViEVR/NPTW','technician',1,'2025-09-29 17:55:19',0),(8,'Askenaz','askenazvincent10@gmail.com','$2b$12$ygpbadcFu595haATOWJa0OS4zMbwfbb9wBo4MUGZLPnLykCWxIovW','consultant',1,'2025-10-04 14:20:21',0),(9,'Askenaz ','codeveilstudio@gmail.com','$2b$12$n7l6CwXLEKd43V5KhAS9L.iNkXCGLngghRBWLZwcEvIdvBP8Ng/1K','supplier',1,'2025-10-04 14:26:49',0),(10,'Test User','testbanned@example.com','$2b$12$TfY5L0CX093w1WUbzxCHHOfxJjZ3c48CnUsPsGdiwQUmKsaXPQNTu','contractor',1,'2025-10-04 14:45:41',0);
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

-- Dump completed on 2025-10-04 23:17:29
