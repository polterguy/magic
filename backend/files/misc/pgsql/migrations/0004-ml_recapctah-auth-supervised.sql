
alter table ml_types add column recaptcha decimal not null default 0;
alter table ml_types add column auth text null;
alter table ml_types add column supervised smallint not null default 0;
