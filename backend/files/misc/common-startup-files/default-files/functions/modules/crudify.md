# Function; Generate CRUD endpoint
FUNCTION ==> crudify

The following function can be used to generate one CRUD HTTP endpoint wrapping a database table, using the same CRUD generator the dashboard is using. Invoke it once for each HTTP verb you want to generate.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/modules/crudify.hl]:
{
  "database": "[STRING_VALUE]",
  "database-type": "[STRING_VALUE]",
  "connection-string": "[STRING_VALUE]",
  "table": "[STRING_VALUE]",
  "moduleName": "[STRING_VALUE]",
  "moduleUrl": "[STRING_VALUE]",
  "verb": "[STRING_VALUE]",
  "auth": "[STRING_VALUE]",
  "returnId": "[BOOLEAN_VALUE]",
  "overwrite": "[BOOLEAN_VALUE]",
  "args": {
    "columns": [
      {
        "name": "[COLUMN_NAME]",
        "type": "[COLUMN_TYPE]"
      }
    ]
  }
}
___
```

Arguments:

- `database` is the mandatory name of the database to wrap, e.g. `chinook`. It can only contain a-z, 0-9, `_` and `-`.
- `database-type` is optional and can be either `mysql`, `pgsql`, `mssql` or `sqlite`. Defaults to `sqlite`.
- `connection-string` is optional and defaults to `generic`.
- `table` is the mandatory name of the table to wrap. For PostgreSQL tables outside the public schema use `schema.table`.
- `moduleName` is the mandatory name of the module to generate the endpoint inside of.
- `moduleUrl` is the mandatory relative URL of the generated endpoint, typically the name of the table.
- `verb` is the mandatory HTTP verb to generate an endpoint for, and can be either `get`, `post`, `put` or `delete`.
- `auth` is an optional comma separated list of roles allowed to invoke the endpoint, or `*` to allow any authenticated user. Omitting it creates an endpoint anyone can invoke.
- `returnId` is optional, and if true makes the POST endpoint return the id of the created record.
- `overwrite` is optional, and if true will overwrite previously generated endpoint files.
- `args` is the mandatory column declarations. Columns are declared as a list of objects, each with a `name` and a `type` field, where type is the Hyperlambda type of the column, being `long`, `string`, `decimal`, `double`, `date` or `bool`. For `get` provide `columns` being every column the endpoint returns. For `post` provide `columns` being the insertable columns. For `put` provide `columns` being the updatable non-key columns, plus `primary` being the primary key columns, both in that same format. For `delete` provide only `primary`, where each key is instead a single-field object using the column name as field and the type as value, e.g. `{"primary":[{"AlbumId":"long"}]}`.

Retrieve the column names and types with the `get-database-schema` function first, and create the module with the `create-module` function unless it already exists. Generating a `get` endpoint also generates a record count endpoint, and `get` endpoints support paging, sorting and filtering, where filtering happens through arguments named `Table.Column.operator`, e.g. `Album.AlbumId.eq`. Generated endpoints are instantly available as HTTP endpoints and MCP tools, and can be tested with the `invoke-endpoint` function.
