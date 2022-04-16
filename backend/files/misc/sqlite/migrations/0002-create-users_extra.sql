

create table "users_extra" (
  "user" varchar(256) not null,
  "type" varchar(45) not null,
  "value" varchar(1024) not null,
  constraint "users_extra_fky" foreign key ("user") references "users" ("username") on delete cascade,
  primary key("user", "type")
);
create index "users_extra_user_idx" on "users_extra" ("user");
