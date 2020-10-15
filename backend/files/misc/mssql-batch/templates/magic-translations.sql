/*
 * This MS SQL script creates a minimalistic translation type
 * of database for you in your Microsoft SQL server.
 */
create database magic_translations;

go

use magic_translations;

go

/*
 * Contains all supported languages in the system.
 */
 create table languages (
  locale varchar(5) not null,
  description varchar(2048) null,
  primary key (locale)
)

go

/*
 * Inserting default language.
 */
insert into languages (locale, description) values ('en', 'English')

go

/*
 * Contains all translated units in the system.
 */
 create table translations (
  id varchar(128) not null,
  locale varchar(5) not null,
  content text null,
  primary key (id, locale),
  constraint translations_languages_fky foreign key (locale) references languages (locale)
)

go

/*
 * Prevents locking the database, in case user wants to drop it later.
 * This is a problem due to connection pooling, which we're eliminating by
 * explicitly changing the active database.
 */
use master
