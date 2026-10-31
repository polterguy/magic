---
title: magic.lambda.mssql
---

This is the Microsoft SQL Server data adapter for Magic. This project allows you to provide a semantic
lambda structure to its slots, which in turn will dynamically create a SQL Server dialect SQL statement
for you, for all basic types of CRUD SQL statements. In addition, it provides slots to open a SQL Server
database connection, and such allows you to declare your own SQL statements, to be executed towards a
SQL Server database. Slots this project contains are as follows.

* __[mssql.connect]__ - Connects to a database
* __[mssql.create]__ - Creates a single record in the specified table
* __[mssql.read]__ - Reads multiple records from the specified table
* __[mssql.update]__ - Updates a single record in the specified table
* __[mssql.delete]__ - Deletes a single record in the specified table
* __[mssql.select]__ - Executes an arbitrary SQL statement, and returns results of reader as lambda objects to caller
* __[mssql.scalar]__ - Executes an arbitrary SQL statement, and returns the result as a scalar value to caller
* __[mssql.execute]__ - Executes an arbitrary SQL statement
* __[mssql.execute-batch]__ - Executes a batch SQL script on the current SQL Server connection
* __[mssql.transaction.create]__ - Creates a new transaction
* __[mssql.transaction.commit]__ - Explicitly commits an open transaction
* __[mssql.transaction.rollback]__ - Explicitly rolls back an open transaction
* __[.db-factory.connection.mssql]__ - Creates a SQL Server connection factory (private C# slot)

**Notice** - If you use any of the CRUD slots from above, the whole idea is that you can polymorphistically
use the same lambda object, towards any of the underlying database types, and the correct specific syntax
for your particular database vendor's SQL syntax will be automatically generated. This allows you to
transparently use the same lambda object, towards any of the database types Magic supports, without having to
change it in any ways.

All of the slots in this project are documented in the documentation for the _"magic.data.common"_ project.
If you replace the **[data.xxx]** or **[sql.xxx]** slots with **[mssql.xxx]**, you will use the SQL Server
specific slots, instead of the generic, and/or polymorphistic slots.
Hence, please refer to the documentation for [_"magic.data.common"_](https://docs.ainiro.io/plugins/magic.data.common/) to see the complete documentation for this
project. If you need for instance documentation about the **[mssql.connect]** slot you should look for the
documentation for **[data.connect]**, since it's more or less the exact same documentation.

## How to use [mssql.execute-batch]

Executes a batch SQL script, such as a schema creation script, on the SQL Server connection opened by **[mssql.connect]**.
SQL Server cannot execute scripts containing `GO` separators as one single command, so this slot splits the script
on every line consisting only of `GO` (case insensitive), and executes each part as its own command. This is the
difference between this slot and **[mssql.execute]**, which executes its SQL as one single command.

* __[value]__ - The batch SQL script to execute. Can be a constant or an expression.

After execution the slot's value is `null`, and it has one child per executed batch, each containing a
**[Records affected]** node.

This slot executes a script made of several batches against the open connection. A line containing only `GO` separates one batch from the next, which is what SQL Server tools do, and each batch is executed on its own. The slot adds one child node per batch, telling how many records the batch affected. Below is an example.

```
mssql.connect:sakila
   mssql.execute-batch:@"update actor set last_name = 'Smith' where actor_id = 1
GO
update actor set last_name = 'Jones' where actor_id = 2"

// The result of the above looks like the following.
mssql.execute-batch
   ""
      Records affected:int:1
   ""
      Records affected:int:1
```


## How to use [mssql.connect]

This slot opens a connection to a Microsoft SQL Server database, and evaluates its lambda object with that connection open. It works like **[data.connect]**, except it always uses Microsoft SQL Server. You can pass in only the name of the database, which is substituted for the `{database}` part of the generic connection string in your _"appsettings.json"_ file, or a complete connection string. Below is an example.

```
mssql.connect:sakila
   mssql.select:select first_name, last_name from actor limit 5
```

## How to use [mssql.select]

This slot executes any SQL you give it against the open connection, and returns every record as a lambda object. It works like **[data.select]**, except it always uses Microsoft SQL Server. Below is an example.

```
mssql.connect:sakila
   mssql.select:select first_name, last_name from actor limit 2

// The result of the above looks like the following.
mssql.connect
   mssql.select
      ""
         first_name:PENELOPE
         last_name:GUINESS
      ""
         first_name:NICK
         last_name:WAHLBERG
```

## How to use [mssql.scalar]

This slot executes SQL returning a single value, such as an aggregate, and sets the value of its own node to the result. It works like **[data.scalar]**, except it always uses Microsoft SQL Server. Below is an example, counting the records of a table.

```
mssql.connect:sakila
   mssql.scalar:select count(*) from actor
```

## How to use [mssql.execute]

This slot executes SQL you do not expect any result from, such as updates and deletes. It works like **[data.execute]**, except it always uses Microsoft SQL Server. Below is an example.

```
mssql.connect:sakila
   mssql.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [mssql.transaction.create]

This slot creates a database transaction, and evaluates its lambda object inside of it. It works like **[data.transaction.create]**. Unless the transaction is explicitly committed before it leaves scope, it is rolled back, which is what happens below.

```
mssql.connect:sakila
   mssql.transaction.create
      mssql.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [mssql.transaction.commit]

This slot commits the open transaction. It works like **[data.transaction.commit]**. Without it a transaction is rolled back when it leaves scope. Below is an example.

```
mssql.connect:sakila
   mssql.transaction.create
      mssql.execute:update actor set last_name = 'Smith' where actor_id = 1
      mssql.transaction.commit
```

## How to use [mssql.transaction.rollback]

This slot explicitly rolls back the open transaction, discarding everything done since it was created. It works like **[data.transaction.rollback]**. Below is an example.

```
mssql.connect:sakila
   mssql.transaction.create
      mssql.execute:update actor set last_name = 'Smith' where actor_id = 1
      mssql.transaction.rollback
```

## How to use [mssql.create]

This slot inserts a record into a table, generating the SQL for Microsoft SQL Server. It works like **[data.create]**, and its value becomes the ID of the new record unless **[return-id]** is false. Below is an example.

```
mssql.connect:sakila
   mssql.create
      table:actor
      values
         first_name:John
         last_name:Doe
```

## How to use [mssql.read]

This slot reads records from a table, generating the SQL for Microsoft SQL Server, and returns them as a lambda object. It works like **[data.read]**, and limits the result to 25 records unless you supply **[limit]**. Below is an example.

```
mssql.connect:sakila
   mssql.read
      table:actor
      columns
         first_name
         last_name
      order:last_name
      limit:5
```

## How to use [mssql.update]

This slot updates records in a table, generating the SQL for Microsoft SQL Server, and resolves to the number of records affected. It works like **[data.update]**. Always supply **[where]**, or every record in the table is updated. Below is an example.

```
mssql.connect:sakila
   mssql.update
      table:actor
      values
         last_name:Smith
      where
         and
            first_name:John
            last_name:Doe
```

## How to use [mssql.delete]

This slot deletes records from a table, generating the SQL for Microsoft SQL Server, and resolves to the number of records affected. It works like **[data.delete]**. Always supply **[where]**. Below is an example.

```
mssql.connect:sakila
   mssql.delete
      table:actor
      where
         and
            first_name:John
            last_name:Doe
```
