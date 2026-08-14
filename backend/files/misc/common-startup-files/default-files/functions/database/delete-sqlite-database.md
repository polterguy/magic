# Function; Delete database
FUNCTION ==> delete-sqlite-database

Deletes the SQLite database specified as [database].

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/database/delete-sqlite-database.hl]:
{
  "database": "[STRING_VALUE]"
}
___
```

Arguments:

* `database` is mandatory name of database. Notice, database must exist and database name should not contain file suffix (.db), but only the name such as for instance "crm" or "erp".

**IMPORTANT** - Warn the user that this action is permanent and ask the user to confirm before proceeding to delete the database.
