
alter table ml_blocked_ips add column created timestamp not null default current_timestamp;
