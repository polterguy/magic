
/*
 * This MySQL script creates a database for you, with 3 tables,
 * serving as an authentication/authorization database for you.
 */

/*
 * Creating database
 */
CREATE DATABASE IF NOT EXISTS `magic_auth`;
USE `magic_auth`;

/*
 * Creating users table.
 */
CREATE TABLE `users` (
  `username` varchar(256) NOT NULL,
  `password` varchar(256) NOT NULL,
  PRIMARY KEY (`username`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*
 * Creating roles table.
 */
CREATE TABLE `roles` (
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*
 * Creating association between roles and users through users_roles table.
 */
CREATE TABLE `users_roles` (
  `role` varchar(45) NOT NULL,
  `user` varchar(256) NOT NULL,
  PRIMARY KEY (`role`, `user`),
  KEY `roles_fky_idx` (`role`),
  KEY `users_fky_idx` (`user`),
  CONSTRAINT `roles_fky` FOREIGN KEY (`role`) REFERENCES `roles` (`name`) ON DELETE CASCADE,
  CONSTRAINT `users_fky` FOREIGN KEY (`user`) REFERENCES `users` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*
 * Inserting some few roles into our roles table.
 */
insert into roles (name) values ('root');
insert into roles (name) values ('user');
insert into roles (name) values ('guest');
