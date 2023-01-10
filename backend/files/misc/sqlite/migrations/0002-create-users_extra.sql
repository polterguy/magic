

create table "users_extra" (
  "user" varchar(256) not null collate nocase,
  "type" varchar(45) not null collate nocase,
  "value" varchar(1024) not null collate nocase,
  constraint "users_extra_fky" foreign key ("user") references "users" ("username") on delete cascade,
  primary key("user", "type")
);
create index "users_extra_user_idx" on "users_extra" ("user");
