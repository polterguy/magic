
/*
 * This MySQL script creates a database for you, serving
 * as Magic's main database.
 */


/*
 * Creates the authentication database in MySQL.
 */


/*
 * Creating users table.
 */
create table `users` (
  `username` varchar(256) not null,
  `password` varchar(256) not null,
  primary key (`username`),
  unique key `username_UNIQUE` (`username`)
);


/*
 * Creating roles table.
 */
create table `roles` (
  `name` varchar(45) not null,
  `description` varchar(256) null,
  primary key (`name`),
  unique key `name_UNIQUE` (`name`)
);


/*
 * Creating association between roles and users through users_roles table.
 */
create table `users_roles` (
  `role` varchar(45) not null,
  `user` varchar(256) not null,
  primary key (`role`, `user`),
  key `roles_fky_idx` (`role`),
  key `users_fky_idx` (`user`),
  constraint `roles_fky` foreign key (`role`) references `roles` (`name`) on delete cascade,
  constraint `users_fky` foreign key (`user`) references `users` (`username`) on delete cascade
);


/*
 * Inserting some few roles into our roles table.
 */
insert into roles (name, description) values ('root', 'This is a root account in your system, and it has complete access to do anything.');
insert into roles (name, description) values ('user', 'This is a normal user in your system, and it does not have elevated rights in general.');
insert into roles (name, description) values ('guest', 'This is just a guest visitor to your system, and does not have elevated rights in general.');


/*
 * Tasks and task scheduler tables
 */


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


/*
 * Logging tables.
 */


/*
 * Creating log table.
 */
create table log_entries (
  id int(11) not null auto_increment,
  created datetime not null default current_timestamp,
  type varchar(10) not null,
  content text not null,
  exception text null,
  primary key (id),
  unique key id_UNIQUE (id)
);


/*
 * Cryptography tables.
 */


/*
 * Creating crypto_keys table for holding public cryptography keys.
 */
create table crypto_keys (
  id int(11) not null auto_increment,
  subject varchar(120) not null, /* Typically the name of the owner of the key */
  domain varchar(250) null, /* The base URL of the subject */
  email varchar(120) null, /* Email address of owner */
  content text not null, /* Actual public key */
  fingerprint varchar(120) not null, /* Public key's SHA256 value, in 'fingerprint' format */
  imported datetime not null default current_timestamp,
  type varchar(20) not null, /* Typically 'RSA' or something */
  primary key (id),
  unique key id_UNIQUE (id),
  unique key fingerprint_UNIQUE (fingerprint),
  unique key email_UNIQUE (email),
  unique key url_UNIQUE (url)
);
