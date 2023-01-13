
alter table ml_types add column recaptcha real not null default 0;
alter table ml_types add column auth text null;
alter table ml_types add column supervised int not null default 0;
