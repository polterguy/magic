
create table ml_types(
  "type" varchar(256) not null,
  "model" varchar(1024) not null,
  "max_tokens" integer not null,
  "temperature" decimal not null,
  primary key (type)
);

create table ml_training_snippets(
  "id" serial not null,
  "created" timestamptz not null default now(),
  "type" varchar(256) not null default 'hl',
  "pushed" smallint not null default 0,
  "uri" varchar(1024) null,
  "prompt" text not null,
  "completion" text not null,
  primary key (id),
  constraint "ml_training_snippets_type_fky" foreign key ("type") references "ml_types" ("type") on delete cascade
);
