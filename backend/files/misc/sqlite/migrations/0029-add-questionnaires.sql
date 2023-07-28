
create table questionnaires (
  name varchar(40) not null primary key
);

create table questions(
  question_id integer not null primary key autoincrement,
  question text not null,
  questionnaire varchar(40) not null references questionnaires(name) on delete cascade
);
