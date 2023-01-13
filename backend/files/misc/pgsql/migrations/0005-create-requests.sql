
create table ml_requests(
  "id" serial not null,
  "created" timestamptz not null default now(),
  "type" varchar(256) not null,
  "prompt" text not null,
  "completion" text not null,
  "finish_reason" varchar(100) not null,
  primary key (id),
  constraint "ml_requests_types_fky" foreign key ("type") references "ml_types" ("type") on delete cascade
);
