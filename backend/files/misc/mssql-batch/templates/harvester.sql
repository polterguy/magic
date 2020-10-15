/*
 * This MS SQL script creates a minimalistic harvester type
 * of database for you in Microsoft SQL Server, allowing you
 * to have people register their names, emails, etc.
 *
 * Typical example is to have people register for your newsletters,
 * become customers, etc.
 */
create database harvester;

go

use harvester;

go

/*
 * Contains all supported languages in the system.
 */
 create table registrations (
  email varchar(150) not null,
  first_name varchar(100) not null,
  last_name varchar(100) null,
  phone varchar(25) null,
  address1 varchar(250) null,
  address2 varchar(250) null,
  city varchar(50) null,
  zip varchar(50) null,
  country varchar(50) null,
  primary key (email)
);

go

/*
 * Prevents locking the database, in case user wants to drop it later.
 * This is a problem due to connection pooling, which we're eliminating by
 * explicitly changing the active database.
 */
use master
