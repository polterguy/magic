# Function; List endpoints
FUNCTION ==> list-endpoints

The following function can be used to list all HTTP endpoints in Magic, including the internal system endpoints.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/list-endpoints.hl]
___
```

This function will return relative URLs, HTTP verbs, and authorization requirements. If the auth field does not exist, it means it's a publicly available function for all. If it contains '*' it means any role, but must be authenticated. Otherwise it might contain a list of roles where the user must belong to at least one of these.
