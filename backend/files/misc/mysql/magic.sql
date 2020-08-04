
/*
 * This MySQL script creates a database for you, with 5 tables,
 * serving as an authentication/authorization database for you,
 * in addition to your task scheduler database tables.
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


/*
 * Creating tasks table.
 */
create table tasks (
  id varchar(256) not null,
  description varchar(1024) null,
  hyperlambda text not null,
  created datetime not null default current_timestamp,
  primary key (id)
);


/*
 * Creating task_due table.
 */
create table task_due (
  id int(11) not null auto_increment,
  task varchar(256) not null,
  due datetime not null,
  repeats varchar(128) null,
  constraint task_due_task_fky foreign key (task) references tasks (id) on delete cascade,
  primary key (id),
  unique key id_UNIQUE (id)
);
