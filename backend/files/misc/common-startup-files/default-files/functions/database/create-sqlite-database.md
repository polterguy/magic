# Function; Create database
FUNCTION ==> create-sqlite-database

Creates the SQLite database specified as [database].

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/database/create-sqlite-database.hl]:
{
  "database": "[STRING_VALUE]"
}
___
```

Arguments:

* `database` is a mandatory argument being name of database. Notice, database must not exist from before, and database name should not contain file suffix (.db), but only the name such as for instance "crm" or "erp".

Databases can only contain a-z, and 0-9, "_", and "-" in their names.

