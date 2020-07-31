
/*
 * This MySQL script creates the Magic Task Scheduler database for you,
 * in MySQL.
 */
create database magic_tasks
go

use magic_tasks
go

/*
 * Creating tasks table.
 */
create table tasks (
  id int(11) not null auto_increment,
  description varchar(1024) not null,
  content ntext not null,
  created datetime not null default current_timestamp,
  constraint [pk_tasks] primary key clustered 
  (
      id asc
  )
)
go

/*
 * Creating task_log table.
 */
create table task_log (
  task_id int(11) not null,
  success boolean not null,
  exception text null,
  when datetime not null default current_timestamp,
  constraint [task_log_task_id_fky] foreign key ([task_id]) references [dbo].[tasks] ([id]) on delete cascade
)
go

/*
 * Creating task_due table.
 */
create table task_due (
  id int(11) not null auto_increment,
  task_id int(11) not null,
  due datetime not null default current_timestamp,

  /*
   * The following if defined should be a repetition pattern, in the form of
   * MM.dd.HH.mm.ss.ww, where ww equals weekday, being one of the predefined .Net
   * weekday enumeration values. Implying that the following.
   * "**.01.00.00.00.**" becomes "the first day in every month at 00:00:00 hours", or
   * "**.05|15.01.00.00.**" becomes "the 5th day and the 15th day in every month at 01:00:00 hours", or
   * "**.**.05.00.00.**" becomes "the every day at 05:00 hours", or
   * "**.**.12.30.00.Saturday" becomes "every Saturday at 12:30", or
   * "**.**.23.50.55.Monday|Tuesday|Friday" becomes "every Monday, Tuesday and Friday at 23:50:55", or
   * "**.**.**.05.05.**" becomes "every 5 minutes and 5 seconds", etc.
   *
   * Then when a task is created its first due date is calculated. When the task is due, and have
   * been executed, the next due data will be calculated, and the record will be updated with the
   * next due date.
   *
   * If no repetition pattern is defined (null), the task will only be executed once, during its
   * due date as defined when created, for then to have it task_due record deleted.
   */
  repetition varchar(128) null,
  constraint task_due_task_id_fky foreign key (task_id) references tasks (id) on delete cascade,
  primary key (id),
  unique key id_UNIQUE (id)
)
go
