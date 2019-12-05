
/****** Object:  Database [magic_auth]    Script Date: 05/12/2019 3:13:05 PM ******/
CREATE DATABASE [magic_auth];


USE [magic_auth];

CREATE TABLE [dbo].[users](
	[username] [nvarchar](128) NOT NULL,
	[password] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_users] PRIMARY KEY CLUSTERED 
(
	[username] ASC
);

CREATE TABLE [dbo].[roles](
	[name] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_roles] PRIMARY KEY CLUSTERED 
(
	[name] ASC
);

CREATE TABLE [dbo].[users_roles](
	[user] [nvarchar](128) NOT NULL,
	[role] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_users_roles] PRIMARY KEY CLUSTERED 
(
	[user] ASC,
	[role] ASC
);

insert into roles (name) values ('root');
insert into roles (name) values ('user');
insert into roles (name) values ('guest');
