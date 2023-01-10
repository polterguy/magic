

create table users_extra (
  user varchar(256) not null,
  type varchar(45) not null,
  value varchar(1024) not null,
  primary key (user, type),
  key users_extra_fky_idx (user),
  constraint users_extra_fky foreign key (user) references users (username) on delete cascade
);
