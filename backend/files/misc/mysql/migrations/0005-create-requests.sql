
create table ml_requests(
  id int(11) not null auto_increment,
  created timestamp not null default current_timestamp,
  type varchar(256) not null,
  prompt text not null,
  completion longtext not null,
  finish_reason varchar(100) not null,
  primary key (id),
  constraint ml_requests_types_fky foreign key (type) references ml_types (type) on delete cascade
);
