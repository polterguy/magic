

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
  `name` varchar(20) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `account_types` WRITE;
INSERT INTO `account_types` VALUES ('lead', 'A potential future client'),('client', 'An actual client account'),('vip', 'A VIP client account');
UNLOCK TABLES;


CREATE TABLE `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `account_type` varchar(20) NOT NULL,
  `phone` varchar(45) DEFAULT NULL,
  `street` varchar(128) DEFAULT NULL,
  `city` varchar(45) DEFAULT NULL,
  `zip` varchar(12) DEFAULT NULL,
  `country` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_typefky_idx` (`account_type`),
  CONSTRAINT `account_type_fky` FOREIGN KEY (`account_type`) REFERENCES `account_types` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


/*
 * Creating tables associated with contacts.
 */
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(128) NOT NULL,
  `last_name` varchar(128) NOT NULL,
  `email` varchar(256) DEFAULT NULL,
  `phone` varchar(45) DEFAULT NULL,
  `account_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `accounts_fky_idx` (`account_id`),
  CONSTRAINT `accounts_fky` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `contacts_extra_type` (
  `type` varchar(20) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `contacts_extra_type` WRITE;
INSERT INTO `contacts_extra_type` VALUES ('facebook', 'Facebook handle for your contact'),('twitter', 'Twitter handle for your contact'),('linkedin', 'LinkedIn URL to your contacts profile');
UNLOCK TABLES;


CREATE TABLE `contacts_extra` (
  `contact` int(11) NOT NULL,
  `type` varchar(20) NOT NULL,
  `value` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`contact`,`type`),
  KEY `contacts_extra_type_fky_idx` (`type`),
  KEY `contacts_extra_fky_idx` (`contact`),
  CONSTRAINT `contacts_extra_type_fky` FOREIGN KEY (`type`) REFERENCES `contacts_extra_type` (`type`) ON DELETE CASCADE,
  CONSTRAINT `contacts_fky` FOREIGN KEY (`contact`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


/*
 * Creating activity related tables.
 */
CREATE TABLE `activity_types` (
  `name` varchar(20) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `activity_types` WRITE;
INSERT INTO `activity_types` VALUES ('phone', 'A phone conversation with a contact'),('email', 'An email activity, implying a sent email'),('meeting', 'A physical meeting with your contact'),('misc', 'Some other activity related to a contact');
UNLOCK TABLES;


CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `contact` int(11) DEFAULT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `header` varchar(128) NOT NULL,
  `description` varchar(2048) DEFAULT NULL,
  `done` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`),
  KEY `type_fky_idx` (`type`),
  KEY `contact_fky_idx` (`contact`),
  CONSTRAINT `contact_fky` FOREIGN KEY (`contact`) REFERENCES `contacts` (`id`),
  CONSTRAINT `type_fky` FOREIGN KEY (`type`) REFERENCES `activity_types` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*
 * And we're done. Feel free to add any additional tables to your schema below here ...
 */
