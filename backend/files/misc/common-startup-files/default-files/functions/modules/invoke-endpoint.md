# Function; Invoke endpoint
FUNCTION ==> invoke-endpoint

The following function can be used to invoke one of this backend's own HTTP endpoints, and returns whatever the endpoint returns.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/modules/invoke-endpoint.hl]:
{
  "url": "[STRING_VALUE]",
  "verb": "[STRING_VALUE]",
  "arguments": {
    "[ARGUMENT_NAME]": "[ARGUMENT_VALUE]"
  }
}
___
```

Arguments:

- `url` is the mandatory relative URL of the endpoint to invoke, exactly as the `list-endpoints` function reports it, e.g. `magic/modules/chinook/albums`. Only endpoints inside the `/modules/` folder can be invoked.
- `verb` is the mandatory HTTP verb of the endpoint to invoke, and can be either `get`, `post`, `put`, `delete` or `patch`.
- `arguments` is optional key/value arguments passed into the endpoint as it is invoked.

Use this function to test an endpoint after generating it with the `crudify` function or the `create-sql-endpoint` function, instead of assuming it works. The endpoint is invoked as the currently authenticated user, so no URL or token has to be assembled. If the invocation fails, use the `read-log` function to see the exception.
