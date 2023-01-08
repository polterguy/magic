create table openai_training_snippets(
  "openai_training_snippet_id" integer not null primary key autoincrement,
  "created" timestamp not null default current_timestamp,
  "type" text not null default 'hyperlambda',
  "pushed" int not null default 0,
  "filename" text null,
  "description" text not null,
  "content" text not null
);
