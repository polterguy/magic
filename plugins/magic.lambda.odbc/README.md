---
title: magic.lambda.odbc
---

This is the ODBC data adapter for Magic. This project provides slots to open an ODBC database
connection, and allows you to execute your own SQL statements towards an open ODBC connection. Slots
this project contains are as follows.

* __[odbc.connect]__ - Connects to a database
* __[odbc.select]__ - Executes an arbitrary SQL statement, and returns results of reader as lambda objects to caller
* __[odbc.scalar]__ - Executes an arbitrary SQL statement, and returns the result as a scalar value to caller
* __[odbc.execute]__ - Executes an arbitrary SQL statement
* __[odbc.transaction.create]__ - Creates a new transaction
* __[odbc.transaction.commit]__ - Explicitly commits an open transaction
* __[odbc.transaction.rollback]__ - Explicitly rolls back an open transaction

All of the slots in this project are documented in the documentation for the _"magic.data.common"_ project.
If you replace the **[data.xxx]** or **[sql.xxx]** slots with **[odbc.xxx]**, you will use the ODBC specific
slots, instead of the generic, and/or polymorphistic slots.
Hence, please refer to the documentation for _"magic.data.common"_ to see the complete documentation for this
project. If you need for instance documentation about the **[odbc.connect]** slot you should look for the
documentation for **[data.connect]**, since it's more or less the exact same documentation.

## ODBC data adapter drivers

Notice, Magic does _not_ install any ODBC drivers for your specific database type during installation. Hence,
depending upon which database type you want to use, you're going to have to manually make sure you install
the driver for it yourself, by adding the NuGet package for your particular database type and manually building
the _"backend.csproj"_ file yourself, using for instance the DotNet CLI. The reasons for this is because there
exists literally hundreds of different databases out there having specific ODBC data adapter drivers, and
installing all of these would be impossible for us to do.

## How to use [odbc.connect]

This slot opens a connection to a ODBC database, and evaluates its lambda object with that connection open. It works like **[data.connect]**, except it always uses ODBC. You can pass in only the name of the database, which is substituted for the `{database}` part of the generic connection string in your _"appsettings.json"_ file, or a complete connection string. Below is an example.

```
odbc.connect:sakila
   odbc.select:select first_name, last_name from actor limit 5
```

## How to use [odbc.select]

This slot executes any SQL you give it against the open connection, and returns every record as a lambda object. It works like **[data.select]**, except it always uses ODBC. Below is an example.

```
odbc.connect:sakila
   odbc.select:select first_name, last_name from actor limit 2

// The result of the above looks like the following.
odbc.connect
   odbc.select
      ""
         first_name:PENELOPE
         last_name:GUINESS
      ""
         first_name:NICK
         last_name:WAHLBERG
```

## How to use [odbc.scalar]

This slot executes SQL returning a single value, such as an aggregate, and sets the value of its own node to the result. It works like **[data.scalar]**, except it always uses ODBC. Below is an example, counting the records of a table.

```
odbc.connect:sakila
   odbc.scalar:select count(*) from actor
```

## How to use [odbc.execute]

This slot executes SQL you do not expect any result from, such as updates and deletes. It works like **[data.execute]**, except it always uses ODBC. Below is an example.

```
odbc.connect:sakila
   odbc.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [odbc.transaction.create]

This slot creates a database transaction, and evaluates its lambda object inside of it. It works like **[data.transaction.create]**. Unless the transaction is explicitly committed before it leaves scope, it is rolled back, which is what happens below.

```
odbc.connect:sakila
   odbc.transaction.create
      odbc.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [odbc.transaction.commit]

This slot commits the open transaction. It works like **[data.transaction.commit]**. Without it a transaction is rolled back when it leaves scope. Below is an example.

```
odbc.connect:sakila
   odbc.transaction.create
      odbc.execute:update actor set last_name = 'Smith' where actor_id = 1
      odbc.transaction.commit
```

## How to use [odbc.transaction.rollback]

This slot explicitly rolls back the open transaction, discarding everything done since it was created. It works like **[data.transaction.rollback]**. Below is an example.

```
odbc.connect:sakila
   odbc.transaction.create
      odbc.execute:update actor set last_name = 'Smith' where actor_id = 1
      odbc.transaction.rollback
```
