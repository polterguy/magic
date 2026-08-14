# Function; List roles for user
FUNCTION ==> list-users-roles

This function returns a list of all roles the specified [username] belongs to.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/users_roles/list-users-roles.hl]:
{
  "username": "[STRING_VALUE]"
}
___
```

Arguments:

* `username` is mandatory and the user you want to retrieve the roles for.

Notice, if user does not belong to any roles, or does not exist, an empty result will be returned.
