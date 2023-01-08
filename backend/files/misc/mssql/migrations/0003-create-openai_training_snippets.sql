create table openai_training_snippets(
  id int not null identity(1,1),
  created datetime not null default getutcdate(),
  type nvarchar(256) not null default 'hyperlambda',
  pushed bit not null default 0,
  uri nvarchar(1024) null,
  prompt ntext not null,
  completion ntext not null,
  constraint pk_openai_training_snippets primary key clustered(id asc)
);
