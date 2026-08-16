# Function; List operations in an OpenAPI specification
FUNCTION ==> list-openapi-operations

If the user wants to wrap somebody else's API - Stripe, GitHub, Slack, or anything else publishing an OpenAPI or Swagger specification - you can use the following function to read the specification and see which operations it declares.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/modules/list-openapi-operations.hl]:
{
  "url": "[STRING_VALUE]",
  "filter": "[STRING_VALUE]"
}
___
```

Arguments:

- `url` is the mandatory URL of the OpenAPI or Swagger specification to read.
- `filter` is an optional case insensitive substring, narrowing the result to operations whose id, summary or tag contains it.

The function understands OpenAPI 3.x and Swagger 2.0, in either JSON or YAML. It returns the specification's `title` and `version`, the `servers` it declares, its `security-schemes`, and one record per operation with an `id`, `verb`, `path`, `summary` and `tag`.

Specifications vary enormously in size - GitHub's declares more than a thousand operations - so use `filter` when the user is after a specific part of an API. The result tells you how many operations `matched` and how many were `returned`, and when those two numbers differ you must narrow the filter rather than assume you have seen everything.

Use this function before the `import-openapi` function, which needs the operation ids and the base URL this one returns.
