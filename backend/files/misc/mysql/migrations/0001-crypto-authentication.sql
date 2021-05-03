
/*
 * This MySQL script migrates the database to accommodate for the
 * ability to associate a public cryptography key with a user record.
 */
use magic;


/*
 * Updating our database version.
 */
delete from magic_version;
insert into magic_version(db_version) values ('009.001.007');


/*
 * Creating association table between users and crypto_keys.
 */
create table `users_crypto_keys` (
  `username` varchar(256) not null,
  `key_id` int(11) not null,
  primary key (`username`, `key_id`),
  unique key `username_UNIQUE` (`username`),
  unique key `key_id_UNIQUE` (`key_id`),
  constraint `username_fky` foreign key (`username`) references `users` (`username`) on delete cascade,
  constraint `key_id_fky` foreign key (`key_id`) references `crypto_keys` (`id`) on delete cascade
);
