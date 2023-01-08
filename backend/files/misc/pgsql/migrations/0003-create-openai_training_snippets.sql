create table training_snippets(
  "id" serial not null,
  "created" timestamptz not null default now(),
  "type" varchar(256) not null default 'hyperlambda',
  "pushed" smallint not null default 0,
  "uri" varchar(1024) null,
  "prompt" text not null,
  "completion" text not null
);
