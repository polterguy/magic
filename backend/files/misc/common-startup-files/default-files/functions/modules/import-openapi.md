# Function; Wrap a third party API as endpoints
FUNCTION ==> import-openapi

The following function wraps operations from a third party OpenAPI or Swagger specification as HTTP endpoints in the cloudlet, using the same importer the dashboard's Import API tab is using.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/modules/import-openapi.hl]:
{
  "url": "[STRING_VALUE]",
  "moduleName": "[STRING_VALUE]",
  "operations": "[STRING_VALUE]",
  "baseUrl": "[STRING_VALUE]",
  "authScheme": "[STRING_VALUE]",
  "authName": "[STRING_VALUE]",
  "configKey": "[STRING_VALUE]",
  "auth": "[STRING_VALUE]",
  "overwrite": "[BOOLEAN_VALUE]"
}
___
```

Arguments:

- `url` is the mandatory URL of the OpenAPI or Swagger specification to wrap.
- `moduleName` is the mandatory name of the module to generate the endpoints inside of.
- `operations` is the mandatory comma separated list of operation ids to wrap, exactly as returned by the `list-openapi-operations` function, e.g. `get /pet/{petId},post /pet`.
- `baseUrl` is the mandatory base URL of the upstream API, typically the first entry `list-openapi-operations` returned in `servers`.
- `authScheme` is optional and decides how the generated endpoints authenticate towards the upstream API. It can be either `none`, `bearer`, `header`, `query` or `basic`, and defaults to `none`.
- `authName` is optional and is the name of the header or query parameter carrying the credential. It is required when `authScheme` is `header` or `query`.
- `configKey` is optional and is the configuration key the generated endpoints read the upstream credential from, e.g. `magic:integrations:stripe:key`.
- `auth` is an optional comma separated list of roles allowed to invoke the generated endpoints. Omitting it creates endpoints anyone can invoke.
- `overwrite` is optional, and if true will overwrite previously generated endpoint files.

Retrieve the operation ids and the base URL with the `list-openapi-operations` function first. The function returns the files it `created`, the operations it `skipped` because they were not found in the specification, and `loc` being how many lines of Hyperlambda it generated.

Query parameters and form fields become named, typed arguments of the generated endpoints, carrying the types, defaults, accepted values and descriptions the specification declares, and required arguments are validated before the upstream API is contacted. Generated endpoints are instantly available as HTTP endpoints and MCP tools, and can be tested with the `invoke-endpoint` function.

The upstream credential is never written into the generated files. It is read from configuration when the endpoint is invoked, so tell the user which `configKey` you used and remind them to store the credential under it before invoking anything. By default the function refuses to replace an endpoint that already exists, and tells you which file was in the way.
