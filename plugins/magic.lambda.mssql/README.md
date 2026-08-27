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
* __[mssql.transaction.create]__ - Creates a new transaction
* __[mssql.transaction.commit]__ - Explicitly commits an open transaction
* __[mssql.transaction.rollback]__ - Explicitly rolls back an open transaction

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

