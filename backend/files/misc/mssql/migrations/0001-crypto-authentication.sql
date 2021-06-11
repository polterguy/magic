
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
if not exists (select * from sysobjects where name='users_crypto_keys' and xtype='U') begin

  create table users_crypto_keys (
    username nvarchar(128) not null,
    key_id int not null,
    unique(key_id),
    constraint pk_users_crypto_keys primary key clustered(username, key_id)
  );

  /*
   * Creating foreign key towards users.
   */
  alter table users_crypto_keys
    add foreign key (username)
    references users(username)
    on delete cascade;

  /*
   * Creating foreign key towards crypto_keys.
   */
  alter table users_crypto_keys
    add foreign key (key_id)
    references crypto_keys(id)
    on delete cascade;

end

go
