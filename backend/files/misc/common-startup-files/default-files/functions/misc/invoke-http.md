# Function; Invoke or execute an HTTP endpoint
FUNCTION ==> invoke-http

The following function can be used to invoke an HTTP endpoint.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/invoke-http.hl]:
{
  "url": "[STRING_VALUE]",
  "verb": "[STRING_VALUE]",
  "payload": "[STRING_VALUE]",
  "token": "[STRING_VALUE]",
  "headers": {
    "Content-Type": "application/javascript",
    "Accept": "application/javascript"
  }
}
___
```

Arguments:

- `url` is mandatory and the URL. If you add query parameters to it, please make sure they're URL encoded
- `verb` is the optional HTTP verb to use in invocation. Defaults to "get". Legal values are; "post", "put", "get", "patch", or "delete".
- `payload` is the optional JSON string that becomes the payload to send. Notice, can only be applied for "post", "put" and "patch" endpoints.
- `token` optional Bearer token that will be added to the Authorization HTTP header as "Bearer TOKEN_HERE".
- `headers` optional collection of key-value HTTP headers for the HTTP invocation.
