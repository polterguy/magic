/*
 * This Microsoft SQL Server script creates a database for you, serving
 * as Magic's main database.
 */
use master;
create database magic;

go

use magic;


/*
 * Creates the authentication database in Microsoft SQL Server.
 */


/*
 * Creating our users table in the dbo namespace.
 */
create table users (
  username nvarchar(128) not null,
  [password] nvarchar(128) not null,
  [locked] bit not null default 0,
  created datetime not null default getutcdate(),
  constraint pk_users primary key clustered(username asc)
);

go


/*
 * Creating our roles table in the dbo namespace.
 */
create table roles (
  [name] nvarchar(45) not null,
  [description] nvarchar(128) not null,
  constraint pk_roles primary key clustered([name] asc)
);

go


/*
 * Creating our users_roles table in the dbo namespace.
 * This table is our association from one user to multiple roles.
 */
create table users_roles (
  [user] nvarchar(128) not null,
  [role] nvarchar(45) not null,
  constraint pk_users_roles primary key clustered([user] asc, [role] asc)
);

go


alter table users_roles
  add foreign key ([user])
  references users(username)
  on delete cascade;

go

alter table users_roles
  add foreign key ([role])
  references roles([name])
  on delete cascade;

go


/*
 * Inserting some roles into our roles table.
 */
insert into roles ("name", "description") values ('root', 'A user that has complete access to everything in the system');
insert into roles ("name", "description") values ('admin', 'An administrator with elevated rights to do things other cannot do');
insert into roles ("name", "description") values ('guest', 'A confirmed user with some elevated rights');
insert into roles ("name", "description") values ('reset-password', 'A special role that only allows the user to change his password');
insert into roles ("name", "description") values ('unconfirmed', 'An unconfirmed user that has severely restricted access');
insert into roles ("name", "description") values ('blocked', 'A user that has been blocked from site entirely');

go


/*
 * Creating tasks table.
 */
create table tasks (
  id nvarchar(256) not null,
  [description] nvarchar(1024) null,
  hyperlambda ntext not null,
  created datetime not null default getutcdate(),
  constraint pk_tasks primary key clustered(id asc)
);

go


/*
 * Creating task_due table.
 */
create table task_due (
  id int not null identity(1,1),
  task nvarchar(256) not null,
  due datetime not null,
  repeats nvarchar(128) null,
  constraint pk_task_due primary key clustered(id asc)
);
alter table task_due
  add foreign key (task)
  references tasks(id)
  on delete cascade;

go


/*
 * Logging tables.
 */


/*
 * Creating log table.
 */
create table log_entries (
  id int not null identity(1,1),
  created datetime not null default getutcdate(),
  type nvarchar(10) not null,
  content ntext not null,
  exception ntext null,
  constraint pk_log_entries primary key clustered(id asc)
);

go


/*
 * Cryptography tables.
 */


/*
 * Creating crypto_keys table for holding public cryptography keys.
 */
create table crypto_keys (
  id int not null identity(1,1),
  subject nvarchar(120) not null,
  domain nvarchar(250) not null,
  email nvarchar(120) not null,
  content text not null,
  vocabulary text not null,
  fingerprint nvarchar(120) not null,
  imported datetime not null default getutcdate(),
  type nvarchar(20) not null,
  enabled bit not null,
  constraint pk_crypto_keys primary key clustered(id asc),
  unique(fingerprint)
);

go


/*
 * Creating crypto_invocations table for holding invocations associated
 * with some public key.
 */
create table crypto_invocations (
  id int not null identity(1,1),
  crypto_key int not null,
  request_id nvarchar(120) not null,
  request text not null,
  request_raw text not null,
  response text not null,
  created datetime not null default getutcdate(),
  constraint pk_crypto_invocations primary key clustered(id asc),
  unique(request_id),
);
alter table crypto_invocations
  add foreign key (crypto_key)
  references crypto_keys(id)
  on delete cascade;

go

/*
 * Creating association table between users and crypto_keys.
 */
create table users_crypto_keys (
  username nvarchar(128) not null,
  key_id int not null,
  unique(key_id),
  constraint pk_users_crypto_keys primary key clustered(username, key_id)
)

go

/*
 * Creating foreign key towards users.
 */
alter table users_crypto_keys
  add foreign key (username)
  references users(username)
  on delete cascade;

go

/*
 * Creating foreign key towards crypto_keys.
 */
alter table users_crypto_keys
  add foreign key (key_id)
  references crypto_keys(id)
  on delete cascade;

go


/*
 * This might look stupid, but actually releases our database's connections for some reasons,
 * due to connection pooling or something in SQL Server "holding" the connection open.
 * Hence, by explicitly using master for current connection, we can more easily drop database
 * later, if something goes wrong, and we need to re-run the setup process.
 */
use [master];