
USE [master]
GO

CREATE DATABASE [magic_auth]
GO

USE [magic_auth]
GO

CREATE TABLE [dbo].[users](
	[username] [nvarchar](128) NOT NULL,
	[password] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_users] PRIMARY KEY CLUSTERED 
(
	[username] ASC
)
GO

CREATE TABLE [dbo].[roles](
	[name] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_roles] PRIMARY KEY CLUSTERED 
(
	[name] ASC
)
GO

CREATE TABLE [dbo].[users_roles](
	[user] [nvarchar](128) NOT NULL,
	[role] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_users_roles] PRIMARY KEY CLUSTERED 
(
	[user] ASC,
	[role] ASC
)
GO

insert into roles (name) values ('root');
insert into roles (name) values ('user');
insert into roles (name) values ('guest');
