
CREATE DATABASE [magic_auth]
GO

USE [magic_auth];
CREATE TABLE [dbo].[users](
	[username] [nvarchar](128) NOT NULL,
	[password] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_users] PRIMARY KEY CLUSTERED 
(
	[username] ASC
)
GO

USE [magic_auth];
CREATE TABLE [dbo].[roles](
	[name] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_roles] PRIMARY KEY CLUSTERED 
(
	[name] ASC
)
GO

USE [magic_auth];
CREATE TABLE [dbo].[users_roles](
	[user] [nvarchar](128) NOT NULL,
	[role] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_users_roles] PRIMARY KEY CLUSTERED 
(
	[user] ASC,
	[role] ASC
)
GO

USE [magic_auth];
insert into roles (name) values ('root');
GO

USE [magic_auth];
insert into roles (name) values ('user');
GO

USE [magic_auth];
insert into roles (name) values ('guest');