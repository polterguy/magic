
alter table ml_types add column contact_us text null;
alter table ml_types add column lead_email text null;
alter table ml_requests add column session text null;
alter table ml_training_snippets add columns cached int null;

