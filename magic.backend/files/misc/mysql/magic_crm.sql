

/*
 * Creating actual database, and making sure we use it, such that
 * when we create tables, they're created in the correct database.
 */
CREATE DATABASE `magic_crm`;
USE `magic_crm`;


/*
 * Creating account types, and accounts.
 */
CREATE TABLE `account_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `account_types` WRITE;
INSERT INTO `account_types` VALUES (1,'Lead'),(2,'Client');
UNLOCK TABLES;


CREATE TABLE `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `account_type` int(11) NOT NULL,
  `phone` varchar(45) DEFAULT NULL,
  `street` varchar(128) DEFAULT NULL,
  `city` varchar(45) DEFAULT NULL,
  `zip` varchar(12) DEFAULT NULL,
  `country` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_typefky_idx` (`account_type`),
  CONSTRAINT `account_type_fky` FOREIGN KEY (`account_type`) REFERENCES `account_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


/*
 * Creating tables associated with contacts.
 */
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(11) NOT NULL,
  `first_name` varchar(128) NOT NULL,
  `last_name` varchar(128) NOT NULL,
  `email` varchar(256) DEFAULT NULL,
  `phone` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `accounts_fky_idx` (`account_id`),
  CONSTRAINT `accounts_fky` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `contacts_extra_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_UNIQUE` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `contacts_extra_type` WRITE;
INSERT INTO `contacts_extra_type` VALUES (1,'Facebook'),(2,'Twitter'),(3,'LinkedIn');
UNLOCK TABLES;


CREATE TABLE `contacts_extra` (
  `contact` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `value` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`contact`,`type`),
  KEY `contacts_extra_type_fky_idx` (`type`),
  KEY `contacts_extra_fky_idx` (`contact`),
  CONSTRAINT `contacts_extra_type_fky` FOREIGN KEY (`type`) REFERENCES `contacts_extra_type` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contacts_fky` FOREIGN KEY (`contact`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


/*
 * Creating activity related tables.
 */
CREATE TABLE `activity_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `activity_types` WRITE;
INSERT INTO `activity_types` VALUES (1,'Phone'),(2,'Email'),(3,'Meeting'),(4,'Misc');
UNLOCK TABLES;


CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL,
  `contact` int(11) DEFAULT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `header` varchar(128) NOT NULL,
  `description` varchar(2048) DEFAULT NULL,
  `done` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`),
  KEY `type_fky_idx` (`type`),
  KEY `contact_fky_idx` (`contact`),
  CONSTRAINT `contact_fky` FOREIGN KEY (`contact`) REFERENCES `contacts` (`id`),
  CONSTRAINT `type_fky` FOREIGN KEY (`type`) REFERENCES `activity_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*
 * And we're done. Feel free to add any additional tables to your schema below here ...
 */
