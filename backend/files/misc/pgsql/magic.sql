
/*
 * This MySQL script creates a database for you, serving
 * as Magic's main database.
 */


/*
 * Creates the authentication database in PgSQL.
 */


/*
 * Creating users table.
 */
create table "users" (
  "username" varchar(256) not null,
  "password" varchar(256) not null,
  "locked" boolean not null default false,
  "created" timestamptz not null default now(),
  primary key ("username")
);


/*
 * Creating roles table.
 */
create table "roles" (
  "name" varchar(45) not null,
  "description" varchar(256) null,
  primary key ("name")
);


/*
 * Creating association between roles and users through users_roles table.
 */
create table "users_roles" (
  "role" varchar(45) not null,
  "user" varchar(256) not null,
  primary key ("role", "user"),
  constraint "roles_fky" foreign key ("role") references "roles" ("name") on delete cascade,
  constraint "users_fky" foreign key ("user") references "users" ("username") on delete cascade
);
create index "users_roles_user_idx" on "users_roles" ("user");


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
  created timestamptz not null default now(),
  primary key (id)
);
create unique index "tasks_id_idx" on "tasks" ("id");


/*
 * Creating task_due table.
 */
create table task_due (
  id serial not null,
  task varchar(256) not null,
  due timestamptz not null,
  repeats varchar(128) null,
  constraint task_due_task_fky foreign key (task) references tasks (id) on delete cascade,
  primary key (id)
);
create index "task_due_task_idx" on "task_due" ("task");


/*
 * Logging tables.
 */


/*
 * Creating log table.
 */
create table log_entries (
  id serial not null,
  created timestamptz not null default now(),
  type varchar(10) not null,
  content text not null,
  exception text null,
  primary key (id)
);


/*
 * Cryptography tables.
 */


/*
 * Creating crypto_keys table for holding public cryptography keys.
 */
create table crypto_keys (
  id serial not null,
  subject varchar(120) not null,
  email varchar(120) not null,
  domain varchar(250) null,
  type varchar(20) not null,
  fingerprint varchar(120) not null,
  content text not null,
  vocabulary text not null,
  imported timestamptz not null default now(),
  enabled boolean not null default false,
  primary key (id)
);
create index "crypto_keys_subject_idx" on "crypto_keys" ("subject");
create index "crypto_keys_email_idx" on "crypto_keys" ("email");


/*
 * Creating crypto_invocations table for holding invocations associated
 * with some public key.
 */
create table crypto_invocations (
  id serial not null,
  crypto_key integer not null,
  request_id varchar(250) not null,
  request text not null,
  request_raw text not null,
  response text not null,
  created timestamptz not null default now(),
  primary key (id),
  constraint "request_id_UNIQUE" unique ("request_id"),
  constraint "crypto_key_fky" foreign key ("crypto_key") references "crypto_keys" ("id") on delete cascade
);
create index "crypto_invocations_crypto_key_idx" on "crypto_invocations" ("crypto_key");


/*
 * Creating association table between users and crypto_keys.
 */
create table "users_crypto_keys" (
  "username" varchar(256) not null,
  "key_id" integer not null,
  primary key ("username", "key_id"),
  constraint "username_fky" foreign key ("username") references "users" ("username") on delete cascade,
  constraint "key_id_fky" foreign key ("key_id") references "crypto_keys" ("id") on delete cascade
);
create index "users_crypto_keys_username_idx" on "users_crypto_keys" ("username");
create index "users_crypto_keys_key_id_idx" on "users_crypto_keys" ("key_id");
