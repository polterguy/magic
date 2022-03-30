
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
  "username" text not null primary key,
  "password" text not null,
  "locked" boolean not null default false,
  "created" timestamp not null default current_timestamp
);


/*
 * Creating roles table.
 */
create table "roles" (
  "name" text not null primary key,
  "description" text null
);


/*
 * Creating association between roles and users through users_roles table.
 */
create table "users_roles" (
  "role" text not null,
  "user" text not null,
  constraint "roles_fky" foreign key ("role") references "roles" ("name") on delete cascade,
  constraint "users_fky" foreign key ("user") references "users" ("username") on delete cascade,
  primary key("role", "user")
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
  id text not null primary key,
  description text null,
  hyperlambda text not null,
  created timestamp not null default current_timestamp
);
create unique index "tasks_id_idx" on "tasks" ("id");


/*
 * Creating task_due table.
 */
create table task_due (
  id integer not null primary key autoincrement,
  task text not null,
  due timestamp not null,
  repeats text null,
  constraint task_due_task_fky foreign key (task) references tasks (id) on delete cascade
);
create index "task_due_task_idx" on "task_due" ("task");


/*
 * Logging tables.
 */


/*
 * Creating log table.
 */
create table log_entries (
  id integer not null primary key autoincrement,
  created timestamp not null default current_timestamp,
  type text not null,
  content text not null,
  meta text null,
  exception text null
);


/*
 * Cryptography tables.
 */


/*
 * Creating crypto_keys table for holding public cryptography keys.
 */
create table crypto_keys (
  id integer primary key autoincrement not null,
  subject text not null, 
  email text not null, 
  domain text null, 
  type text not null, 
  fingerprint text not null, 
  content text not null, 
  vocabulary text not null, 
  imported timestamp not null default current_timestamp,
  enabled boolean not null default false
);
create index "crypto_keys_subject_idx" on "crypto_keys" ("subject");
create index "crypto_keys_email_idx" on "crypto_keys" ("email");


/*
 * Creating crypto_invocations table for holding invocations associated
 * with some public key.
 */
create table crypto_invocations (
  id integer primary key autoincrement not null,
  crypto_key integer not null,
  request_id text not null,
  request text not null,
  request_raw text not null,
  response text not null,
  created timestamp not null default current_timestamp,
  constraint "request_id_UNIQUE" unique ("request_id"),
  constraint "crypto_key_fky" foreign key ("crypto_key") references "crypto_keys" ("id") on delete cascade
);
create index "crypto_invocations_crypto_key_idx" on "crypto_invocations" ("crypto_key");


/*
 * Creating association table between users and crypto_keys.
 */
create table "users_crypto_keys" (
  "username" text not null,
  "key_id" integer not null,
  constraint "username_fky" foreign key ("username") references "users" ("username") on delete cascade,
  constraint "key_id_fky" foreign key ("key_id") references "crypto_keys" ("id") on delete cascade,
  primary key("username", "key_id")
);
create index "users_crypto_keys_username_idx" on "users_crypto_keys" ("username");
create index "users_crypto_keys_key_id_idx" on "users_crypto_keys" ("key_id");
