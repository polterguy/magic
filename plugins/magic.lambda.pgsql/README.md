---
title: magic.lambda.pgsql
---

This is the PostgreSQL data adapter for Magic. This project allows you to provide a semantic lambda structure
to its slots, which in turn will dynamically create a PostgreSQL dialect SQL statement for you, for all basic
types of CRUD SQL statements. In addition, it provides slots to open a PostgreSQL database connection, and
such allows you to declare your own SQL statements to be executed towards a PostgreSQL database. Slots
this project contains are as follows.

* __[pgsql.connect]__ - Connects to a database
* __[pgsql.create]__ - Creates a single record in the specified table
* __[pgsql.read]__ - Reads multiple records from the specified table
* __[pgsql.update]__ - Updates a single record in the specified table
* __[pgsql.delete]__ - Deletes a single record in the specified table
* __[pgsql.select]__ - Executes an arbitrary SQL statement, and returns results of reader as lambda objects to caller
* __[pgsql.scalar]__ - Executes an arbitrary SQL statement, and returns the result as a scalar value to caller
* __[pgsql.execute]__ - Executes an arbitrary SQL statement
* __[pgsql.transaction.create]__ - Creates a new transaction
* __[pgsql.transaction.commit]__ - Explicitly commits an open transaction
* __[pgsql.transaction.rollback]__ - Explicitly rolls back an open transaction
* __[.db-factory.connection.pgsql]__ - Creates a PostgreSQL connection factory (private C# slot)

**Notice** - If you use any of the CRUD slots from above, the whole idea is that you can polymorphistically
use the same lambda object, towards any of the underlying database types, and the correct specific syntax
for your particular database vendor's SQL syntax will be automatically generated. This allows you to
transparently use the same lambda object, towards any of the database types Magic supports, without having to
change it in any ways.

All of the slots in this project are documented in the documentation for the _"magic.data.common"_ project.
If you replace the **[data.xxx]** or **[sql.xxx]** slots with **[pgsql.xxx]**, you will use the PgSQL specific
slots, instead of the generic, and/or polymorphistic slots.
Hence, please refer to the documentation for _"magic.data.common"_ to see the complete documentation for this
project. If you need for instance documentation about the **[pgsql.connect]** slot you should look for the
documentation for **[data.connect]**, since it's more or less the exact same documentation.

## How to use [pgsql.connect]

This slot opens a connection to a PostgreSQL database, and evaluates its lambda object with that connection open. It works like **[data.connect]**, except it always uses PostgreSQL. You can pass in only the name of the database, which is substituted for the `{database}` part of the generic connection string in your _"appsettings.json"_ file, or a complete connection string. Below is an example.

```
pgsql.connect:sakila
   pgsql.select:select first_name, last_name from actor limit 5
```

## How to use [pgsql.select]

This slot executes any SQL you give it against the open connection, and returns every record as a lambda object. It works like **[data.select]**, except it always uses PostgreSQL. Below is an example.

```
pgsql.connect:sakila
   pgsql.select:select first_name, last_name from actor limit 2

// The result of the above looks like the following.
pgsql.connect
   pgsql.select
      ""
         first_name:PENELOPE
         last_name:GUINESS
      ""
         first_name:NICK
         last_name:WAHLBERG
```

## How to use [pgsql.scalar]

This slot executes SQL returning a single value, such as an aggregate, and sets the value of its own node to the result. It works like **[data.scalar]**, except it always uses PostgreSQL. Below is an example, counting the records of a table.

```
pgsql.connect:sakila
   pgsql.scalar:select count(*) from actor
```

## How to use [pgsql.execute]

This slot executes SQL you do not expect any result from, such as updates and deletes. It works like **[data.execute]**, except it always uses PostgreSQL. Below is an example.

```
pgsql.connect:sakila
   pgsql.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [pgsql.transaction.create]

This slot creates a database transaction, and evaluates its lambda object inside of it. It works like **[data.transaction.create]**. Unless the transaction is explicitly committed before it leaves scope, it is rolled back, which is what happens below.

```
pgsql.connect:sakila
   pgsql.transaction.create
      pgsql.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [pgsql.transaction.commit]

This slot commits the open transaction. It works like **[data.transaction.commit]**. Without it a transaction is rolled back when it leaves scope. Below is an example.

```
pgsql.connect:sakila
   pgsql.transaction.create
      pgsql.execute:update actor set last_name = 'Smith' where actor_id = 1
      pgsql.transaction.commit
```

## How to use [pgsql.transaction.rollback]

This slot explicitly rolls back the open transaction, discarding everything done since it was created. It works like **[data.transaction.rollback]**. Below is an example.

```
pgsql.connect:sakila
   pgsql.transaction.create
      pgsql.execute:update actor set last_name = 'Smith' where actor_id = 1
      pgsql.transaction.rollback
```

## How to use [pgsql.create]

This slot inserts a record into a table, generating the SQL for PostgreSQL. It works like **[data.create]**, and its value becomes the ID of the new record unless **[return-id]** is false. Below is an example.

```
pgsql.connect:sakila
   pgsql.create
      table:actor
      values
         first_name:John
         last_name:Doe
```

## How to use [pgsql.read]

This slot reads records from a table, generating the SQL for PostgreSQL, and returns them as a lambda object. It works like **[data.read]**, and limits the result to 25 records unless you supply **[limit]**. Below is an example.

```
pgsql.connect:sakila
   pgsql.read
      table:actor
      columns
         first_name
         last_name
      order:last_name
      limit:5
```

## How to use [pgsql.update]

This slot updates records in a table, generating the SQL for PostgreSQL, and resolves to the number of records affected. It works like **[data.update]**. Always supply **[where]**, or every record in the table is updated. Below is an example.

```
pgsql.connect:sakila
   pgsql.update
      table:actor
      values
         last_name:Smith
      where
         and
            first_name:John
            last_name:Doe
```

## How to use [pgsql.delete]

This slot deletes records from a table, generating the SQL for PostgreSQL, and resolves to the number of records affected. It works like **[data.delete]**. Always supply **[where]**. Below is an example.

```
pgsql.connect:sakila
   pgsql.delete
      table:actor
      where
         and
            first_name:John
            last_name:Doe
```
