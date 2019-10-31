

CREATE DATABASE `magic_crm`;
USE `magic_crm`;


CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `roles` WRITE;
INSERT INTO `roles` VALUES (2,'root',NULL),(3,'employee',NULL);
UNLOCK TABLES;


CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(45) NOT NULL,
  `password` varchar(256) NOT NULL,
  `email` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `users_roles` (
  `role_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`role_id`,`user_id`),
  KEY `roles_fky_idx` (`role_id`),
  KEY `users_fky_idx` (`user_id`),
  CONSTRAINT `roles_fky` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `users_fky` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `account_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `account_types` WRITE;
INSERT INTO `account_types` VALUES (1,'Lead'),(2,'Client');
UNLOCK TABLES;


CREATE TABLE `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `account_type` int(11) NOT NULL,
  `account_manager` int(11) DEFAULT NULL,
  `phone` varchar(45) DEFAULT NULL,
  `street` varchar(128) DEFAULT NULL,
  `city` varchar(45) DEFAULT NULL,
  `zip` varchar(12) DEFAULT NULL,
  `country` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_typefky_idx` (`account_type`),
  KEY `account_manager_fky_idx` (`account_manager`),
  CONSTRAINT `account_manager_fky` FOREIGN KEY (`account_manager`) REFERENCES `users` (`id`),
  CONSTRAINT `account_type_fky` FOREIGN KEY (`account_type`) REFERENCES `account_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


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
  PRIMARY KEY (`id`)
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
  KEY `contacts_extre_fky_idx` (`contact`),
  CONSTRAINT `contacts_extra_type_fky` FOREIGN KEY (`type`) REFERENCES `contacts_extra_type` (`id`),
  CONSTRAINT `contacts_fky` FOREIGN KEY (`contact`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `activity_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `activity_types` WRITE;
INSERT INTO `activity_types` VALUES (1,'Phone'),(2,'Email'),(3,'Meeting');
UNLOCK TABLES;


CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `header` varchar(128) NOT NULL,
  `description` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type_fky_idx` (`type`),
  CONSTRAINT `type_fky` FOREIGN KEY (`type`) REFERENCES `activity_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
