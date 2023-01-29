
alter table log_entries modify meta longtext null;
alter table log_entries modify content longtext not null;
alter table log_entries modify exception longtext null;
