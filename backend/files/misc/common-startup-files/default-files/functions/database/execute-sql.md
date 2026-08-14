# Function; Execute SQL
FUNCTION ==> execute-sql

Connect to the [database] database, and executes the specified [sql].
This function is useful for SQL that doesn't return anything,
or where the result of the execution is not interesting, such as creating tables, and executing DDL, etc.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/database/execute-sql.hl]:
{
  "sql": "[STRING_VALUE]",
  "database": "[STRING_VALUE]",
  "database-type": "[STRING_VALUE]",
  "connection-string": "[STRING_VALUE]"
}
___
```

Arguments:

* `sql` is the mandatory SQL to execute. Unless specifically overridden the dialect should be SQLite.
* `database` is the mandatory database to connect to and execute SQL within.
* `database-type` is an optional argument being database type. Can be either "mysql", "pgsql", "mssql" or "sqlite". Defaults to "sqlite".
* `connection-string` is an optional connection string to use. Defaults to "generic".

**IMPORTANT** - If you're using this function to create database schemas, passing in DDL, you must pass in all the DDL in one go, for multiple tables, indexes, foreign keys, etc - Just make sure they're in the correct order if you do.

**WARNING** - If you're about to execute an SQL that updates, or deletes data, then you must wanr the user that this action is permanent.
