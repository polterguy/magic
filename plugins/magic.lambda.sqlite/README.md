---
title: magic.lambda.sqlite
---

This is the SQLite data adapter for Magic. This project allows you to provide a semantic lambda structure
to its slots, which in turn will dynamically create a SQLite dialect SQL statement for you, for all basic
types of CRUD SQL statements. In addition, it provides slots to open a SQLite database connection, and
such allows you to declare your own SQL statements to be executed towards a SQLite database. Slots
this project contains are as follows.

* __[sqlite.connect]__ - Connects to a database
* __[sqlite.create]__ - Creates a single record in the specified table
* __[sqlite.read]__ - Reads multiple records from the specified table
* __[sqlite.update]__ - Updates a single record in the specified table
* __[sqlite.delete]__ - Deletes a single record in the specified table
* __[sqlite.select]__ - Executes an arbitrary SQL statement, and returns results of reader as lambda objects to caller
* __[sqlite.scalar]__ - Executes an arbitrary SQL statement, and returns the result as a scalar value to caller
* __[sqlite.execute]__ - Executes an arbitrary SQL statement
* __[sqlite.transaction.create]__ - Creates a new transaction
* __[sqlite.transaction.commit]__ - Explicitly commits an open transaction
* __[sqlite.transaction.rollback]__ - Explicitly rolls back an open transaction
* __[sqlite.connections.flush]__ - Flushed cached schemas and connection pools
* __[sqlite.backup]__ - Creates a backup of the currently active database
* __[sqlite.load-extension]__ - Loads a SQLite extension into the current connection from child-node arguments
* __[.db-factory.connection.sqlite]__ - Creates a SQLite connection factory (private C# slot)

**Notice** - If you use any of the CRUD slots from above, the whole idea is that you can polymorphistically
use the same lambda object, towards any of the underlying database types, and the correct specific syntax
for your particular database vendor's SQL syntax will be automatically generated. This allows you to
transparently use the same lambda object, towards any of the database types Magic supports, without having to
change it in any ways.

All of the slots in this project are documented in the documentation for the _"magic.data.common"_ project.
If you replace the **[data.xxx]** or **[sql.xxx]** slots with **[sqlite.xxx]**, you will use the sqlite specific
slots, instead of the generic, and/or polymorphistic slots.
Hence, please refer to the documentation for _"magic.data.common"_ to see the complete documentation for this
project. If you need for instance documentation about the **[sqlite.connect]** slot you should look for the
documentation for **[data.connect]**, since it's more or less the exact same documentation.

## How to use [sqlite.backup]

To create a backup of the database called for instance _"foo"_, you would use code resembling the following.

```
sqlite.connect:[generic|foo]
   sqlite.backup:foo.backup
```

The above will create a backup of your foo database and store it at _"/data/foo.backup"_, allowing you to restore it if
it for some reasons becomes invalid.

## How to use [sqlite.load-extension]

Loads a SQLite extension into the connection opened by **[sqlite.connect]**. The slot takes its arguments as children.

* __[file]__ - Filename of the extension to load. Mandatory, the slot throws an exception if it is missing.
* __[proc]__ - Optional entry point of the extension.
* __[append-platform]__ - Boolean, defaults to `true`. If true, the slot appends `-arm64` or `-arm` to the filename when running on an ARM64 or ARM processor.

The path in **[file]** is a plain file system path, resolved relative to the working directory of your backend, and _not_ relative to
your cloudlet's root folder, which means a leading `/` makes it an absolute path on the server. It can point into a folder, and you should leave out the
file extension, since SQLite adds the one your operating system uses, such as _".so"_, _".dylib"_ or _".dll"_. On ARM processors the slot first appends
`-arm64` or `-arm` to the filename, unless **[append-platform]** is false. Magic ships the vector extension in the _"sqlite-plugins"_ folder, and
below is how Magic itself loads it, using **[proc]** to name the extension's entry point.

```
sqlite.connect:[generic|magic]
   sqlite.load-extension
      file:sqlite-plugins/vector
      proc:sqlite3_vector_init
```


## How to use [sqlite.connect]

This slot opens a connection to a SQLite database, and evaluates its lambda object with that connection open. It works like **[data.connect]**, except it always uses SQLite. You can pass in only the name of the database, which is substituted for the `{database}` part of the generic connection string in your _"appsettings.json"_ file, or a complete connection string. Below is an example.

```
sqlite.connect:sakila
   sqlite.select:select first_name, last_name from actor limit 5
```

## How to use [sqlite.select]

This slot executes any SQL you give it against the open connection, and returns every record as a lambda object. It works like **[data.select]**, except it always uses SQLite. Below is an example.

```
sqlite.connect:sakila
   sqlite.select:select first_name, last_name from actor limit 2

// The result of the above looks like the following.
sqlite.connect
   sqlite.select
      ""
         first_name:PENELOPE
         last_name:GUINESS
      ""
         first_name:NICK
         last_name:WAHLBERG
```

## How to use [sqlite.scalar]

This slot executes SQL returning a single value, such as an aggregate, and sets the value of its own node to the result. It works like **[data.scalar]**, except it always uses SQLite. Below is an example, counting the records of a table.

```
sqlite.connect:sakila
   sqlite.scalar:select count(*) from actor
```

## How to use [sqlite.execute]

This slot executes SQL you do not expect any result from, such as updates and deletes. It works like **[data.execute]**, except it always uses SQLite. Below is an example.

```
sqlite.connect:sakila
   sqlite.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [sqlite.transaction.create]

This slot creates a database transaction, and evaluates its lambda object inside of it. It works like **[data.transaction.create]**. Unless the transaction is explicitly committed before it leaves scope, it is rolled back, which is what happens below.

```
sqlite.connect:sakila
   sqlite.transaction.create
      sqlite.execute:update actor set last_name = 'Smith' where actor_id = 1
```

## How to use [sqlite.transaction.commit]

This slot commits the open transaction. It works like **[data.transaction.commit]**. Without it a transaction is rolled back when it leaves scope. Below is an example.

```
sqlite.connect:sakila
   sqlite.transaction.create
      sqlite.execute:update actor set last_name = 'Smith' where actor_id = 1
      sqlite.transaction.commit
```

## How to use [sqlite.transaction.rollback]

This slot explicitly rolls back the open transaction, discarding everything done since it was created. It works like **[data.transaction.rollback]**. Below is an example.

```
sqlite.connect:sakila
   sqlite.transaction.create
      sqlite.execute:update actor set last_name = 'Smith' where actor_id = 1
      sqlite.transaction.rollback
```

## How to use [sqlite.create]

This slot inserts a record into a table, generating the SQL for SQLite. It works like **[data.create]**, and its value becomes the ID of the new record unless **[return-id]** is false. Below is an example.

```
sqlite.connect:sakila
   sqlite.create
      table:actor
      values
         first_name:John
         last_name:Doe
```

## How to use [sqlite.read]

This slot reads records from a table, generating the SQL for SQLite, and returns them as a lambda object. It works like **[data.read]**, and limits the result to 25 records unless you supply **[limit]**. Below is an example.

```
sqlite.connect:sakila
   sqlite.read
      table:actor
      columns
         first_name
         last_name
      order:last_name
      limit:5
```

## How to use [sqlite.update]

This slot updates records in a table, generating the SQL for SQLite, and resolves to the number of records affected. It works like **[data.update]**. Always supply **[where]**, or every record in the table is updated. Below is an example.

```
sqlite.connect:sakila
   sqlite.update
      table:actor
      values
         last_name:Smith
      where
         and
            first_name:John
            last_name:Doe
```

## How to use [sqlite.delete]

This slot deletes records from a table, generating the SQL for SQLite, and resolves to the number of records affected. It works like **[data.delete]**. Always supply **[where]**. Below is an example.

```
sqlite.connect:sakila
   sqlite.delete
      table:actor
      where
         and
            first_name:John
            last_name:Doe
```

## How to use [sqlite.connections.flush]

This slot clears all of SQLite's pooled connections, which you typically need to do after you have replaced or deleted a database file on disc, since a pooled connection would otherwise keep pointing at the old file. Below is an example.

```
sqlite.connections.flush
```
