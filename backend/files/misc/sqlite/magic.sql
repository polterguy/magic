
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
  "username" varchar(256) not null primary key collate nocase,
  "password" varchar(256) not null,
  "locked" boolean not null default false,
  "created" timestamp not null default current_timestamp
);


/*
 * Creating roles table.
 */
create table "roles" (
  "name" varchar(45) not null primary key collate nocase,
  "description" varchar(256) null collate nocase
);


/*
 * Creating association between roles and users through users_roles table.
 */
create table "users_roles" (
  "role" varchar(45) not null collate nocase,
  "user" varchar(256) not null collate nocase,
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
insert into roles (name, description) values ('service', 'Service acount for web services and API integrations');


/*
 * Tasks and task scheduler tables
 */


/*
 * Creating tasks table.
 */
create table tasks (
  id varchar(256) not null primary key collate nocase,
  description text null collate nocase,
  hyperlambda text not null collate nocase,
  created timestamp not null default current_timestamp
);
create unique index "tasks_id_idx" on "tasks" ("id");


/*
 * Creating task_due table.
 */
create table task_due (
  id integer not null primary key autoincrement,
  task varchar(256) not null collate nocase,
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
  type varchar(10) not null collate nocase,
  content text not null collate nocase,
  exception text null collate nocase
);


/*
 * Cryptography tables.
 */


/*
 * Creating crypto_keys table for holding public cryptography keys.
 */
create table crypto_keys (
  id integer primary key autoincrement not null,
  subject varchar(120) not null collate nocase,
  email varchar(120) not null collate nocase,
  domain varchar(250) null collate nocase,
  type varchar(20) not null collate nocase,
  fingerprint varchar(120) not null collate nocase,
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
  crypto_key integer not null collate nocase,
  request_id varchar(250) not null collate nocase,
  request text not null collate nocase,
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
  "username" varchar(256) not null collate nocase,
  "key_id" integer not null,
  constraint "username_fky" foreign key ("username") references "users" ("username") on delete cascade,
  constraint "key_id_fky" foreign key ("key_id") references "crypto_keys" ("id") on delete cascade,
  primary key("username", "key_id")
);
create index "users_crypto_keys_username_idx" on "users_crypto_keys" ("username");
create index "users_crypto_keys_key_id_idx" on "users_crypto_keys" ("key_id");
