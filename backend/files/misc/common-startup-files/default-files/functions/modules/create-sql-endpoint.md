# Function; Generate SQL endpoint
FUNCTION ==> create-sql-endpoint

The following function can be used to generate one HTTP endpoint executing a custom parametrised SQL statement, using the same SQL endpoint generator the dashboard is using. Use it to expose hand written SQL, such as reports, aggregates, joins and KPIs, as an HTTP endpoint.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/modules/create-sql-endpoint.hl]:
{
  "database": "[STRING_VALUE]",
  "database-type": "[STRING_VALUE]",
  "connection-string": "[STRING_VALUE]",
  "moduleName": "[STRING_VALUE]",
  "endpointName": "[STRING_VALUE]",
  "verb": "[STRING_VALUE]",
  "sql": "[STRING_VALUE]",
  "arguments": "[STRING_VALUE]",
  "authorization": "[STRING_VALUE]",
  "overwrite": "[BOOLEAN_VALUE]"
}
___
```

Arguments:

- `database` is the mandatory name of the database to execute the SQL towards, e.g. `chinook`. It can only contain a-z, 0-9, `_` and `-`.
- `database-type` is optional and can be either `mysql`, `pgsql`, `mssql` or `sqlite`. Defaults to `sqlite`.
- `connection-string` is optional and defaults to `generic`. It can only contain a-z, 0-9, `_` and `-`.
- `moduleName` is the mandatory name of the module to generate the endpoint inside of.
- `endpointName` is the mandatory name of the generated endpoint, without verb and extension. Its relative URL becomes `moduleName/endpointName`.
- `verb` is the mandatory HTTP verb of the generated endpoint, and can be either `get`, `post`, `put`, `delete` or `patch`. Use `get` for endpoints reading data.
- `sql` is the mandatory SQL statement the endpoint executes, referencing endpoint arguments as `@name`, e.g. `select Name from Artist where Name like @filter`. Rows are returned as a list of objects.
- `arguments` is optional argument declarations for the endpoint, as Hyperlambda `name:type` pairs separated by newlines, e.g. `filter:string\nlimit:long`. Types are Hyperlambda types, being `long`, `string`, `decimal`, `double`, `date` or `bool`. Every declared argument is passed to the SQL, implying the SQL must reference each argument as `@name`, and callers must provide all of them when invoking the endpoint.
- `authorization` is an optional comma separated list of roles allowed to invoke the endpoint. Omitting it creates an endpoint anyone can invoke.
- `overwrite` is optional, and if true will overwrite a previously generated endpoint file.

Retrieve the schema with the `get-database-schema` function first to get table and column names correct, and create the module with the `create-module` function unless it already exists. Generated endpoints are instantly available as HTTP endpoints and MCP tools, and can be tested with the `invoke-endpoint` function.
