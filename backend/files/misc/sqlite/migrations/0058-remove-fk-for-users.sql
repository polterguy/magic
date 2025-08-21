create table "ml_history_new" (
  "session_id" varchar(256) not null collate nocase,
  "username" varchar(256) not null collate nocase,
  "content" TEXT not null collate nocase,
  "created" timestamp not null default current_timestamp, name text null,
  primary key("session_id")
);

insert into ml_history_new (session_id, username, content, created) select session_id, username, content, created from ml_history;
drop table ml_history;
alter table ml_history_new rename to ml_history;