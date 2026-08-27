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

