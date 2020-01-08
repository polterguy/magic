

/*
 * Creating our TODO database.
 *
 * Notice, this will throw an exception if the database exists from before.
 */
CREATE DATABASE `magic_todo`;
USE `magic_todo`;


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
  `item_type` varchar(20) NOT NULL,
  `done` bit NOT NULL DEFAULT 0,
  `description` varchar(2048) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `item_typefky_idx` (`item_type`),
  CONSTRAINT `item_type_fky` FOREIGN KEY (`item_type`) REFERENCES `item_types` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
