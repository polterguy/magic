# Function; Create backup of database
FUNCTION ==> create-database-backup

Creates a backup of the SQLite database specified as [database] and returns the full path of the backup as `backup_filename`.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/database/create-database-backup.hl]:
{
  "database": "[STRING_VALUE]"
}
___
```

Arguments:

* `database` is a mandatory argument being name of database. Notice, database must exist from before, and database name should NOT contain file suffix (.db), but only the name such as for instance "crm" or "erp".

If the user wants to backup a database you need to ask which database, and after the backup has been created you should offer the user to use the `download-file` function to allow the user to download the backup to his local machine.
