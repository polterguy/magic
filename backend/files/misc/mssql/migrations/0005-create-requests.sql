
create table ml_requests(
  id int not null identity(1,1),
  created datetime not null default getutcdate(),
  type nvarchar(256) not null,
  prompt ntext not null,
  completion ntext not null,
  finish_reason nvarchar(100) not null,
  constraint ml_requests_types_fky primary key clustered(id asc)
);
