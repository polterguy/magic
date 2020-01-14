

/*
 * Creates the magic_auth database in Microsoft SQL Server.
 */
use [master];
CREATE DATABASE magic_auth;
GO
USE magic_auth;


/*
 * Creating our users table in the dbo namespace.
 */
CREATE TABLE [dbo].[users](
	[username] [nvarchar](128) NOT NULL,
	[password] [nvarchar](128) NOT NULL,
    CONSTRAINT [PK_users] PRIMARY KEY CLUSTERED 
    (
        [username] ASC
    )
);
GO


/*
 * Creating our roles table in the dbo namespace.
 */
CREATE TABLE [dbo].[roles](
	[name] [nvarchar](45) NOT NULL,
	[description] [nvarchar](128) NOT NULL,
    CONSTRAINT [PK_roles] PRIMARY KEY CLUSTERED 
    (
        [name] ASC
    )
);
GO


/*
 * Creating our users_roles table in the dbo namespace.
 * This table is our association from one user to multiple roles.
 */
CREATE TABLE [dbo].[users_roles](
	[user] [nvarchar](128) NOT NULL,
	[role] [nvarchar](45) NOT NULL,
    CONSTRAINT [PK_users_roles] PRIMARY KEY CLUSTERED 
    (
        [user] ASC,
        [role] ASC
    )
);
GO


/*
 * Making sure we get all of our foreign keys correctly defined.
 */
ALTER TABLE [dbo].[users_roles]
    ADD FOREIGN KEY ([user])
    REFERENCES users([username])
    ON DELETE CASCADE;
GO
ALTER TABLE [dbo].[users_roles]
    ADD FOREIGN KEY ([role])
    REFERENCES roles([name])
    ON DELETE CASCADE;
GO


/*
 * Inserting a couple of default roles. Most importantly, the "root" role, which is "special".
 */
insert into roles ("name", "description") values ('root', 'This is a root account in your system, and it has complete access to do anything.');
insert into roles ("name", "description") values ('user', 'This is a normal user in your system, and it does not have elevated rights in general.');
insert into roles ("name", "description") values ('guest', 'This is just a guest visitor to your system, and does not have elevated rights in general.');
GO


/*
 * This might look stupid, but actually releases our database's connections for some reasons,
 * due to connection pooling or something in SQL Server, "holding" the connection open.
 * Hence, by explcitly using master for current connection, we can more easily drop database
 * later, if something goes wrong, and we need to re-run the setup process.
 */
use [master];
