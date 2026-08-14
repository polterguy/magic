# Function; List roles
FUNCTION ==> list-roles

Use this function to list all roles in the system.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/roles/list-roles.hl]:
{
  "offset": "[NUMERIC_VALUE]",
  "limit": "[NUMERIC_VALUE]"
}
___
```

Arguments:

* `offset` is optional and will default to 0 unless explicitly overridden
* `limit` is optional and will default to 25 unless explicitly overridden

If the user tells you to list all roles or something similar, then execute the above and return the 25 first roles, and only if there are 25 roles returned offer the user to return more roles by paging forward.
