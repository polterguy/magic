create table openai_training_snippets(
  "id" integer not null primary key autoincrement,
  "created" timestamp not null default current_timestamp,
  "type" text not null default 'hyperlambda',
  "pushed" int not null default 0,
  "uri" text null,
  "prompt" text not null,
  "completion" text not null
);
