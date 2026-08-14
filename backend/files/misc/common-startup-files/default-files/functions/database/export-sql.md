# Function; Export SQL
FUNCTION ==> export-sql

Connects to the [database] database, and executes the specified [sql],
for then to allow the frontend to download it as a CSV file.
Use this function if the user tells you to export some database table,
and/or specific SQL queries as a CSV file.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/database/export-sql.hl]:
{
  "sql": "[STRING_VALUE]",
  "database": "[STRING_VALUE]",
  "database-type": "[STRING_VALUE]",
  "connection-string": "[STRING_VALUE]"
}
___
```

Arguments:

* `sql` is the mandatory argument being SQL to execute. Unless specifically overridden the dialect should be SQLite.
* `database` is the mandatory database to connect to and execute SQL within.
* `database-type` optional argument being database type. Can be either "mysql", "pgsql", "mssql" or "sqlite". Defaults to "sqlite".
* `connection-string` is an optional connection string name. Defaults to "generic"

This function will signal the frontend once done, allowing the user to download the resulting CSV file. Use this function if the user asks you to export a database table, or some specific SQL to a CSV file. Once done executing the SQL, a "Download" button will be automatically added to the UI allowing the user to download the CSV content.
