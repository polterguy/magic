

/*
 * Creating our CRM database.
 *
 * Notice, this will throw an exception if the database exists from before.
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

INSERT INTO `account_types` VALUES ('lead', 'A potential future client'), ('client', 'An actual client account'), ('vip', 'A VIP client account');


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

INSERT INTO `accounts` (`name`, `account_type`, `phone`, `street`, `city`, `zip`, `country`) VALUES ('Acme, Inc.', 'lead', '96070605', 'Rick St. 57', '9607', 'Los Angeles', 'US');
INSERT INTO `accounts` (`name`, `account_type`, `phone`, `street`, `city`, `zip`, `country`) VALUES ('Foo Bar, Inc.', 'vip', '90545767', 'Foo Bar St. 67', 'San Francisco', '0234', 'US');
INSERT INTO `accounts` (`name`, `account_type`, `phone`, `street`, `city`, `zip`, `country`) VALUES ('Greek Imports.', 'client', '90808080', 'Athens Ave. 57', 'Athens', '1234', 'Greece');


/*
 * Creating contacts tables.
 */
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(128) NOT NULL,
  `last_name` varchar(128) NOT NULL,
  `email` varchar(256) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `account_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `accounts_fky_idx` (`account_id`),
  CONSTRAINT `accounts_fky` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('John', 'Doe', 'john@doe.com', '96070605', 1);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Jane', 'Doe', 'jane@doe.com', '96123456', 1);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Peter', 'Fonda', 'peter@fonda.us', '555-444-6767', 2);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Thomas', 'Hansen', 'thomas@gaiasoul.us', '96070102', 3);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Sandy', 'Jensen', 'sjensen@foo-bar.cy.com', '93010203', 3);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Panicos', 'Demotricus', 'pdemo@forex.com', '90010101', 2);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Timothy', 'Petreus', 'tim_p@hotmail.com', '47010204', 1);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Giorgos', 'Demotriculus', 'george@demotriculus.com', '97080706', 2);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Line', 'Hansen', 'line@norge.no', '42040506', 2);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Helga', 'Schwartz', 'helg_schw@deutschland.de', '12345678', 1);
INSERT INTO `contacts` (`first_name`, `last_name`, `email`, `phone`, `account_id`) VALUES ('Jane', 'Jensen', 'jane@usa.com', '555-444-3322', 1);


CREATE TABLE `contacts_extra_type` (
  `type` varchar(20) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `contacts_extra_type` VALUES 
   ('facebook', 'Facebook handle for your contact'),
   ('twitter', 'Twitter handle for your contact'),
   ('linkedin', 'LinkedIn URL to your contacts profile');


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

INSERT INTO `activity_types` VALUES 
   ('phone', 'A phone conversation with a contact'),
   ('email', 'An email activity, implying a sent email'),
   ('meeting', 'A physical meeting with your contact'),
   ('misc', 'Some other activity related to a contact');


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
