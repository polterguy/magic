
/*
 * This MySQL script creates a database for you, with 3 tables,
 * serving as an authentication/authorization database for you.
 */


/*
 * Creates the authentication database in MySQL.
 */


/*
 * Creating users table.
 */
CREATE TABLE `users` (
  `username` varchar(256) NOT NULL,
  `password` varchar(256) NOT NULL,
  PRIMARY KEY (`username`),
  UNIQUE KEY `username_UNIQUE` (`username`)
);


/*
 * Creating roles table.
 */
CREATE TABLE `roles` (
  `name` varchar(45) NOT NULL,
  `description` varchar(256) NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name_UNIQUE` (`name`)
);

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
);

/*
 * Inserting some few roles into our roles table.
 */
insert into roles (name, description) values ('root', 'This is a root account in your system, and it has complete access to do anything.');
insert into roles (name, description) values ('user', 'This is a normal user in your system, and it does not have elevated rights in general.');
insert into roles (name, description) values ('guest', 'This is just a guest visitor to your system, and does not have elevated rights in general.');
