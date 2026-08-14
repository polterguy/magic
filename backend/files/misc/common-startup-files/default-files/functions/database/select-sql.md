# Function; Execute SQL and return result
FUNCTION ==> select-sql

Connect to the [database] database, and executes the specified [sql],
and returns the result of the SQL as a list of records.
Use this function if the user needs the result of an SQL query.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/database/select-sql.hl]:
{
  "sql": "[STRING_VALUE]",
  "database": "[STRING_VALUE]",
  "database-type": "[STRING_VALUE]",
  "connection-string": "[STRING_VALUE]"
}
___
```

Arguments:

* `sql` is the mandatory SQL to execute. Unless specifically specified as something else the dialect should be SQLite
* `database` is the mandatory database to connect to and execute SQL within.
* `database-type` is an optional argument being database type. Can be either "mysql", "pgsql", "mssql" or "sqlite". Defaults to "sqlite".
* `connection-string` is an optional argument overriding the connection string name. Defaults to "generic".

Notice, if you want to execute SQL that doesn't return anything interesting, such as deleting data, applying schema, etc, you should rather use the "execute-sql" function.
