# Function; Get database schema (DDL)
FUNCTION ==> get-database-schema

Connect to the [database] database, and returns the schema for the specified database.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/database/get-database-schema.hl]:
{
  "database": "[STRING_VALUE]",
  "database-type": "[STRING_VALUE]",
  "connection-string": "[STRING_VALUE]"
}
___
```

Arguments:

* `database` is the mandatory database to connect to and return schema for.
* `database-type` optional argument being database type. Can be either "mysql", "pgsql", "mssql" or "sqlite". Defaults to "sqlite".
* `connection-string` is an optional connection string name. Defaults to "generic"
