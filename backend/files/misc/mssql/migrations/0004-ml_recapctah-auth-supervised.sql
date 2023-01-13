
alter table ml_types add recaptcha decimal(3,2) not null default 0;
alter table ml_types add auth ntext null;
alter table ml_types add supervised bit not null default 0;
