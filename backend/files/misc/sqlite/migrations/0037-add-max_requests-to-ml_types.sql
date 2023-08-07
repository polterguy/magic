
alter table ml_types add column no_requests int not null default 0;
alter table ml_types add column max_requests int not null default -1;

