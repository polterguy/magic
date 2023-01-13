
alter table ml_training_snippets add column recaptcha real default 0;
alter table ml_training_snippets add column auth text null;
alter table ml_training_snippets add column monitor int default 0;
