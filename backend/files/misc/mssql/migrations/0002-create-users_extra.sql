
create table users_extra (
  [user] nvarchar(128) not null,
  [type] nvarchar(45) not null,
  [value] nvarchar(1024) not null,
  constraint pk_users_extra primary key clustered([user] asc, [type] asc)
);

go


alter table users_extra
  add foreign key ([user])
  references users(username)
  on delete cascade;

go
