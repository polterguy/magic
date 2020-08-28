
create database magic_mail;
use magic_mail;

create table emails (
  id int(11) not null auto_increment,
  subject varchar(2048) null,
  body text null,
  direction varchar(20) not null,
  primary key (id)
);

create table contacts (
  id int(11) not null auto_increment,
  email varchar(2048) null,
  primary key (id)
);

create table emails_contacts (
  email_id int(11) not null,
  contact_id int(11) not null,
  primary key (email_id, contact_id),
  key email_id_key (email_id),
  key contact_id_key (contact_id),
  constraint email_fky foreign key (email_id) references emails (id) on delete cascade,
  constraint contact_fky foreign key (contact_id) references contacts (id) on delete cascade
);
