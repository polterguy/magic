
alter table ml_types add column recaptcha decimal(3,2) not null default 0;
alter table ml_types add column auth text null;
alter table ml_types add column monitor int not null default 0;
