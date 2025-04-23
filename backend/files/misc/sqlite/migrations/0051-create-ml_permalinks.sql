
create table ml_permalinks (
  "id" text not null primary key,
  "created" timestamp not null default current_timestamp,
  "messages" text not null
);
