/*
 * This Microsoft SQL Server script creates a database for you, serving
 * as Magic's main database.
 */


/*
 * Creates the authentication database in Microsoft SQL Server.
 */


/*
 * Creating our users table in the dbo namespace.
 */
create table users (
  username nvarchar(128) not null,
  [password] nvarchar(128) not null,
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
 * Inserting a couple of default roles. Most importantly, the "root" role, which is "special".
 */
insert into roles ("name", "description") values ('root', 'This is a root account in your system, and it has complete access to do anything.');
insert into roles ("name", "description") values ('user', 'This is a normal user in your system, and it does not have elevated rights in general.');
insert into roles ("name", "description") values ('guest', 'This is just a guest visitor to your system, and does not have elevated rights in general.');

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
  exception text null,
  content text not null,
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
  fingerprint nvarchar(120) not null,
  imported datetime not null default getutcdate(),
  type nvarchar(20) not null,
  constraint pk_crypto_keys primary key clustered(id asc),
  unique(fingerprint),
  unique(email),
  unique(url)
);

go

/*
 * This might look stupid, but actually releases our database's connections for some reasons,
 * due to connection pooling or something in SQL Server, "holding" the connection open.
 * Hence, by explicitly using master for current connection, we can more easily drop database
 * later, if something goes wrong, and we need to re-run the setup process.
 */
use [master];