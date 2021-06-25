
/*
 * Migrate script template for your MySQL database.
 */
use foo_bar;


/*
 * Creating our table2 table.
 */
create table if not exists `table2` (
  `column2` varchar(128) not null,
  primary key (`column2`)
);
