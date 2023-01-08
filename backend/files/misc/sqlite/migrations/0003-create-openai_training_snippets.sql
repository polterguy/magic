create table openai_training_snippets(
  "openai_training_snippet_id" integer not null primary key autoincrement,
  "type" text not null default 'hyperlambda',
  "description" text not null,
  "content" text not null,
  "created" timestamp not null default current_timestamp
);
