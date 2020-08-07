/*
 * This Microsoft SQL Server script creates a database for you, with 5 tables,
 * serving as an authentication/authorization database for you,
 * in addition to your task scheduler database tables.
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

GO


/*
 * Creating our roles table in the dbo namespace.
 */
create table roles (
  [name] nvarchar(45) not null,
  [description] nvarchar(128) not null,
  constraint pk_roles primary key clustered([name] asc)
);

GO


/*
 * Creating our users_roles table in the dbo namespace.
 * This table is our association from one user to multiple roles.
 */
create table users_roles (
  [user] nvarchar(128) not null,
  [role] nvarchar(45) not null,
  constraint pk_users_roles primary key clustered([user] asc, [role] asc)
);

GO


alter table users_roles
  add foreign key ([user])
  references users(username)
  on delete cascade;

GO

alter table users_roles
  add foreign key ([role])
  references roles([name])
  on delete cascade;

GO


/*
 * Inserting a couple of default roles. Most importantly, the "root" role, which is "special".
 */
insert into roles ("name", "description") values ('root', 'This is a root account in your system, and it has complete access to do anything.');
insert into roles ("name", "description") values ('user', 'This is a normal user in your system, and it does not have elevated rights in general.');
insert into roles ("name", "description") values ('guest', 'This is just a guest visitor to your system, and does not have elevated rights in general.');

GO


/*
 * Creating tasks table.
 */
create table tasks (
  id nvarchar(256) not null,
  [description] nvarchar(1024) null,
  hyperlambda ntext not null,
  created datetime not null default getdate(),
  constraint pk_tasks primary key clustered(id asc)
);

GO


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

GO


/*
 * This might look stupid, but actually releases our database's connections for some reasons,
 * due to connection pooling or something in SQL Server, "holding" the connection open.
 * Hence, by explicitly using master for current connection, we can more easily drop database
 * later, if something goes wrong, and we need to re-run the setup process.
 */
use [master];