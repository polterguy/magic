

create table "ml_history" (
  "session_id" varchar(256) not null collate nocase,
  "username" varchar(256) not null collate nocase,
  "content" TEXT not null collate nocase,
  "created" timestamp not null default current_timestamp,
  constraint "ml_history_users_fky" foreign key ("username") references "users" ("username") on delete cascade,
  primary key("session_id")
);
