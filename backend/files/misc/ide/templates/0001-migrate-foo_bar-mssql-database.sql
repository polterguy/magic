
/*
 * Migrate script template for your SQL Server database.
 */
use foo_bar;

go

/*
 * Creating our table2 table.
 */
if not exists (select * from sysobjects where name='table2' and xtype='U') begin

  create table [table2] (
    column2 nvarchar(128) not null,
    constraint pk_table2 primary key clustered(column2)
  );

end

go
