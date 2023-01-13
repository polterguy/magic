
create table ml_requests(
  "id" integer not null primary key autoincrement,
  "created" timestamp not null default current_timestamp,
  "type" varchar(256) not null,
  "prompt" text not null,
  "completion" text not null,
  "finish_reason" varchar(100) not null,
  constraint "ml_requests_types_fky" foreign key ("type") references "ml_types" ("type") on delete cascade
);
