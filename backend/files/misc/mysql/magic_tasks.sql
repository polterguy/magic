
/*
 * This MySQL script creates the Magic Task Scheduler database for you,
 * in MySQL.
 */
create database magic_tasks;
use magic_tasks;


/*
 * Creating tasks table.
 */
create table tasks (
  id varchar(256) not null,
  description varchar(1024) null,
  hyperlambda text not null,
  created datetime not null default current_timestamp,
  primary key (id)
);


/*
 * Creating task_due table.
 */
create table task_due (
  id int(11) not null auto_increment,
  task varchar(256) not null,
  due datetime not null,
  pattern varchar(128) null,
  constraint task_due_task_fky foreign key (task) references tasks (id) on delete cascade,
  primary key (id),
  unique key id_UNIQUE (id)
);
