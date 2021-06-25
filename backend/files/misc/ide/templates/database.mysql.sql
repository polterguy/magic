/*
 * Creates your MySQL database.
 */
create database foo_bar;
use foo_bar;


/*
 * Creating table table1.
 */
create table `table1` (
  `id` int(11) not null auto_increment,
  `foo` varchar(256) not null,
  primary key (`id`)
);
