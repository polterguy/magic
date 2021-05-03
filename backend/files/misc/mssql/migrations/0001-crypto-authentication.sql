
/*
 * This MS SQL script migrates the database to accommodate for the
 * ability to associate a public cryptography key with a user record.
 */
use magic;


/*
 * Updating our database version.
 */
delete from magic_version;
insert into magic_version(db_version) values ('009.001.007');

go

/*
 * Creating association table between users and crypto_keys.
 */
create table users_crypto_keys (
  username nvarchar(128) not null,
  key_id int not null,
  unique(key_id),
  constraint pk_users_crypto_keys primary key clustered(username, key_id)
)

go

/*
 * Creating foreign key towards users.
 */
alter table users_crypto_keys
  add foreign key (username)
  references users(username)
  on delete cascade;

go

/*
 * Creating foreign key towards crypto_keys.
 */
alter table users_crypto_keys
  add foreign key (key_id)
  references crypto_keys(id)
  on delete cascade;

go
