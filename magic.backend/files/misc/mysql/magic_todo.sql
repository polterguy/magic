

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
 * This is the "root" table of your database.
 */
CREATE TABLE `projects` (
  `name` varchar(20) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


/*
 * Creating item_types, and items.
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


CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `header` varchar(128) NOT NULL,
  `project` varchar(20) NOT NULL,
  `item_type` varchar(20) NOT NULL,
  `created_by` varchar(45) NOT NULL,
  `assigned_to` varchar(45) NULL,
  `created` DATETIME NOT NULL DEFAULT NOW(),
  `done` bit NOT NULL DEFAULT 0,
  `description` varchar(2048) NULL,
  PRIMARY KEY (`id`),
  KEY `item_type_fky_idx` (`item_type`),
  KEY `project_fky_idx` (`project`),
  CONSTRAINT `item_type_fky` FOREIGN KEY (`item_type`) REFERENCES `item_types` (`name`),
  CONSTRAINT `project_fky` FOREIGN KEY (`project`) REFERENCES `projects` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
