
create table ml_types(
  "type" varchar(256) not null primary key,
  "model" varchar(1024) not null,
  "max_tokens" integer not null,
  "temperature" real not null
);

insert into ml_types(type, model, max_tokens, temperature) values ('hl', 'curie', 2000, 0.1);

create table ml_training_snippets(
  "id" integer not null primary key autoincrement,
  "created" timestamp not null default current_timestamp,
  "type" varchar(256) not null default 'hl',
  "pushed" int not null default 0,
  "uri" varchar(1024) null,
  "prompt" text not null,
  "completion" text not null,
  constraint "ml_types_fky" foreign key ("type") references "ml_types" ("type") on delete cascade
);
