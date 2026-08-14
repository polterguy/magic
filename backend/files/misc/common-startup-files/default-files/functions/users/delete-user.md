# Function; Delete user
FUNCTION ==> delete-user

This function allows you to delete an existing user

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/users/delete-user.hl]:
{
  "username": "[STRING_VALUE]"
}
___
```

Arguments:

* `username` is mandatory and is the username of the user to delete

**IMPORTANT** - Warn the user that this action is permanent!
