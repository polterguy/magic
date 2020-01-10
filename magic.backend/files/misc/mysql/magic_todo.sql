

/*
 * Creating our TODO database.
 *
 * Notice, this will throw an exception if the database exists from before.
 */
drop DATABASE `magic_todo`;
CREATE DATABASE `magic_todo`;
USE `magic_todo`;


/*
 * Creating projects table.
 *
 * This is the "root" table of your database.
 */
CREATE TABLE `projects` (
  `name` varchar(20) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `projects` VALUES ('default', 'This is just a dummy example project for you');


/*
 * Creating item_types and states, and inserting some default values
 * into these tables.
 */
CREATE TABLE `item_types` (
  `name` varchar(20) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `item_types` VALUES
   ('bug', 'A bug that needs to be sorted out'),
   ('feature', 'A new feature that needs to be implemented'),
   ('misc', 'Anything that does not match another category');


CREATE TABLE `states` (
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `states` VALUES
   ('new'),
   ('active'),
   ('done'),
   ('deleted');


/*
 * Creating items.
 *
 * These are the actual TODO items.
 */
CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `header` varchar(128) NOT NULL,
  `project` varchar(20) NOT NULL,
  `item_type` varchar(20) NOT NULL,
  `state` varchar(20) NOT NULL,
  `created_by` varchar(45) NOT NULL,
  `assigned_to` varchar(45) NULL,
  `created` DATETIME NOT NULL DEFAULT NOW(),
  `due` DATETIME NULL,
  `done` bit NOT NULL DEFAULT 0,
  `description` varchar(2048) NULL,
  PRIMARY KEY (`id`),
  KEY `item_type_fky_idx` (`item_type`),
  KEY `project_fky_idx` (`project`),
  CONSTRAINT `item_type_fky` FOREIGN KEY (`item_type`) REFERENCES `item_types` (`name`),
  CONSTRAINT `state_fky` FOREIGN KEY (`state`) REFERENCES `states` (`name`),
  CONSTRAINT `project_fky` FOREIGN KEY (`project`) REFERENCES `projects` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `items` (`header`, `project`, `item_type`, `state`, `created_by`, `assigned_to`, `due`, `description`) VALUES
         ('Default TODO item', 'default', 'misc', 'new', 'system', 'root', '2021-01-01T23:59:00', 'This is just a dummy example TODO item for you');


/*
 * Creating comments.
 *
 * This is the discussion related to a single TODO item.
 */
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item` int(11) NOT NULL,
  `created_by` varchar(45) NOT NULL,
  `created` DATETIME NOT NULL DEFAULT NOW(),
  `content` varchar(2048) NULL,
  PRIMARY KEY (`id`),
  KEY `item_fky_idx` (`item`),
  CONSTRAINT `item_fky` FOREIGN KEY (`item`) REFERENCES `items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
