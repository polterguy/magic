---
title: magic.lambda.mysql
---

The magic.lambda.mysql project is Hyperlambda's MySQL data adapter. This project allows you to provide a semantic
lambda structure to its slots, which in turn will dynamically create a MySQL dialect SQL statement for you, for
all basic types of CRUD SQL statements. In addition, it provides slots to open a MySQL database connection, and
such allows you to declare your own SQL statements to be executed towards a MySQL database. Slots
this project contains are as follows.

* __[mysql.connect]__ - Connects to a database
* __[mysql.create]__ - Creates a single record in the specified table
* __[mysql.read]__ - Reads multiple records from the specified table
* __[mysql.update]__ - Updates a single record in the specified table
* __[mysql.delete]__ - Deletes a single record in the specified table
* __[mysql.select]__ - Executes an arbitrary SQL statement, and returns results of reader as lambda objects to caller
* __[mysql.scalar]__ - Executes an arbitrary SQL statement, and returns the result as a scalar value to caller
* __[mysql.execute]__ - Executes an arbitrary SQL statement
* __[mysql.transaction.create]__ - Creates a new transaction
* __[mysql.transaction.commit]__ - Explicitly commits an open transaction
* __[mysql.transaction.rollback]__ - Explicitly rolls back an open transaction
* __[.db-factory.connection.mysql]__ - Creates a MySQL connection factory (private C# slot)

**Notice** - If you use any of the CRUD slots from above, the whole idea is that you can polymorphistically
use the same lambda object, towards any of the underlying database types, and the correct specific syntax
for your particular database vendor's SQL syntax will be automatically generated. This allows you to
transparently use the same lambda object, towards any of the database types Magic supports, without having to
change it in any ways.

All of the slots in this project are documented in the documentation for the _"magic.data.common"_ project.
If you replace the **[data.xxx]** or **[sql.xxx]** slots with **[mysql.xxx]**, you will use the MySQL specific
slots, instead of the generic, and/or polymorphistic slots.
Hence, please refer to the documentation for _"magic.data.common"_ to see the complete documentation for this
project. If you need for instance documentation about the **[mysql.connect]** slot you should look for the
documentation for **[data.connect]**, since it's more or less the exact same documentation.

## How to use [mysql.connect]

This slot opens a connection to a MySQL database, and evaluates its lambda object with that connection open. It works like **[data.connect]**, except it always uses MySQL. You can pass in only the name of the database, which is substituted for the `{database}` part of the generic connection string in your _"appsettings.json"_ file, or a complete connection string. Below is an example.

```
mysql.connect:sakila
   mysql.select:select first_name, last_name from actor limit 5
```

## How to use [mysql.select]

This slot executes any SQL you give it against the open connection, and returns every record as a lambda object. It works like **[data.select]**, except it always uses MySQL. Below is an example.

```
mysql.connect:sakila
   mysql.select:select first_name, last_name from actor limit 2

// The result of the above looks like the following.
mysql.connect
   mysql.select
      ""
         first_name:PENELOPE
         last_name:GUINESS
      ""
         first_name:NICK
         last_name:WAHLBERG
```

## How to use [mysql.scalar]

This slot executes SQL returning a single value, such as an aggregate, and sets the value of its own node to the result. It works like **[data.scalar]**, except it always uses MySQL. Below is an example, counting the records of a table.

```
mysql.connect:sakila
   mysql.scalar:select count(*) from actor
```

## How to use [mysql.execute]

This slot executes SQL you do not expect any result from, such as updates and deletes. It works like **[data.execute]**, except it always uses MySQL. Below is an example.

```
mysql.connect:sakila
   mysql.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [mysql.transaction.create]

This slot creates a database transaction, and evaluates its lambda object inside of it. It works like **[data.transaction.create]**. Unless the transaction is explicitly committed before it leaves scope, it is rolled back, which is what happens below.

```
mysql.connect:sakila
   mysql.transaction.create
      mysql.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [mysql.transaction.commit]

This slot commits the open transaction. It works like **[data.transaction.commit]**. Without it a transaction is rolled back when it leaves scope. Below is an example.

```
mysql.connect:sakila
   mysql.transaction.create
      mysql.execute:update actor set last_name = 'Smith' where actor_id = 1
      mysql.transaction.commit
```

## How to use [mysql.transaction.rollback]

This slot explicitly rolls back the open transaction, discarding everything done since it was created. It works like **[data.transaction.rollback]**. Below is an example.

```
mysql.connect:sakila
   mysql.transaction.create
      mysql.execute:update actor set last_name = 'Smith' where actor_id = 1
      mysql.transaction.rollback
```

## How to use [mysql.create]

This slot inserts a record into a table, generating the SQL for MySQL. It works like **[data.create]**, and its value becomes the ID of the new record unless **[return-id]** is false. Below is an example.

```
mysql.connect:sakila
   mysql.create
      table:actor
      values
         first_name:John
         last_name:Doe
```

## How to use [mysql.read]

This slot reads records from a table, generating the SQL for MySQL, and returns them as a lambda object. It works like **[data.read]**, and limits the result to 25 records unless you supply **[limit]**. Below is an example.

```
mysql.connect:sakila
   mysql.read
      table:actor
      columns
         first_name
         last_name
      order:last_name
      limit:5
```

## How to use [mysql.update]

This slot updates records in a table, generating the SQL for MySQL, and resolves to the number of records affected. It works like **[data.update]**. Always supply **[where]**, or every record in the table is updated. Below is an example.

```
mysql.connect:sakila
   mysql.update
      table:actor
      values
         last_name:Smith
      where
         and
            first_name:John
            last_name:Doe
```

## How to use [mysql.delete]

This slot deletes records from a table, generating the SQL for MySQL, and resolves to the number of records affected. It works like **[data.delete]**. Always supply **[where]**. Below is an example.

```
mysql.connect:sakila
   mysql.delete
      table:actor
      where
         and
            first_name:John
            last_name:Doe
```
