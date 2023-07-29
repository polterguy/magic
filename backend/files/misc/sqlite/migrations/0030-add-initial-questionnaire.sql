
alter table ml_types add column initial_questionnaire varchar(40) null references questionnaires(name);
