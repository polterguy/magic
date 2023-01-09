create table ml_training_snippets(
  id int(11) not null auto_increment,
  created timestamp not null default current_timestamp,
  type varchar(256) not null default 'hyperlambda',
  pushed smallint not null default 0,
  uri varchar(1024) null,
  prompt text not null,
  completion text not null,
  primary key (id)
);
