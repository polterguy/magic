
/*
 * This MySQL script creates a database for you, serving
 * as Magic's main database.
 */
create database magic;
use magic;


/*
 * Creates the authentication database in MySQL.
 */


/*
 * Creating users table.
 */
create table users (
  username varchar(256) not null,
  password varchar(256) not null,
  locked boolean not null default 0,
  created timestamp not null default current_timestamp,
  primary key (username),
  unique key username_UNIQUE (username)
);


/*
 * Creating roles table.
 */
create table roles (
  name varchar(45) not null,
  description varchar(256) null,
  primary key (name),
  unique key name_UNIQUE (name)
);


/*
 * Creating association between roles and users through users_roles table.
 */
create table users_roles (
  role varchar(45) not null,
  user varchar(256) not null,
  primary key (role, user),
  key roles_fky_idx (role),
  key users_fky_idx (user),
  constraint roles_fky foreign key (role) references roles (name) on delete cascade,
  constraint users_fky foreign key (user) references users (username) on delete cascade
);


/*
 * Inserting some roles into our roles table.
 */
insert into roles (name, description) values ('root', 'A user that has complete access to everything in the system');
insert into roles (name, description) values ('admin', 'An administrator with elevated rights to do things other cannot do');
insert into roles (name, description) values ('guest', 'A confirmed user with some elevated rights');
insert into roles (name, description) values ('reset-password', 'A special role that only allows the user to change his password');
insert into roles (name, description) values ('unconfirmed', 'An unconfirmed user that has severely restricted access');
insert into roles (name, description) values ('blocked', 'A user that has been blocked from site entirely');


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
  created timestamp not null default current_timestamp,
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
  created timestamp not null default current_timestamp,
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
  email varchar(120) not null, /* Email address of owner */
  domain varchar(250) null, /* The base URL of the subject */
  type varchar(20) not null, /* Typically 'RSA' or something */
  fingerprint varchar(120) not null, /* Public key's SHA256 value, in 'fingerprint' format */
  content text not null, /* Actual public key */
  vocabulary text not null, /* The vocabulary the key is allowed to evaluate */
  imported timestamp not null default current_timestamp,
  enabled boolean not null, /* If true, the owner is allowed to invoke cryptographically secured endpoints */
  primary key (id),
  unique key id_UNIQUE (id),
  unique key fingerprint_UNIQUE (fingerprint)
);


/*
 * Creating crypto_invocations table for holding invocations associated
 * with some public key.
 */
create table crypto_invocations (
  id int(11) not null auto_increment,
  crypto_key int(11) not null, /* A reference to the crypto key associated with the evaluation */
  request_id varchar(250) not null, /* The ID of the request - Ensures idempotency if caller specifies an ID */
  request text not null, /* The request payload supplied by the caller */
  request_raw text not null, /* The request payload supplied by the caller */
  response text not null, /* The response payload returned to the caller */
  created timestamp not null default current_timestamp,
  primary key (id),
  unique key id_UNIQUE (id),
  unique key request_id_UNIQUE (request_id),
  constraint crypto_key_fky foreign key (crypto_key) references crypto_keys (id) on delete cascade
);


/*
 * Creating association table between users and crypto_keys.
 */
create table users_crypto_keys (
  username varchar(256) not null,
  key_id int(11) not null,
  primary key (username, key_id),
  unique key key_id_UNIQUE (key_id),
  constraint username_fky foreign key (username) references users (username) on delete cascade,
  constraint key_id_fky foreign key (key_id) references crypto_keys (id) on delete cascade
);
