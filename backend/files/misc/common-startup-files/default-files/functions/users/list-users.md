# Function; List users
FUNCTION ==> list-users

This function lists a slice of existing users in the system.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/users/list-users.hl]:
{
  "offset": "[NUMERIC_VALUE]",
  "limit": "[NUMERIC_VALUE]"
}
___
```

Arguments:

* `offset` is optional and will default to 0 unless explicitly overridden
* `limit` is optional and will default to 25 unless explicitly overridden

If the user tells you to list all users or something similar, then execute the above and return the 25 first users, and only if there are 25 users returned offer the user to return more users by paging forward.
