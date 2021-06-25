/*
 * Creates your SQL Server database.
 */
use master;
create database foo_bar;

go

use foo_bar;


/*
 * Creating table table1.
 */
create table [table1] (
  [id] int not null identity(1,1),
  [foo] nvarchar(256) not null,
  constraint pk_messages primary key clustered([id] asc)
);
