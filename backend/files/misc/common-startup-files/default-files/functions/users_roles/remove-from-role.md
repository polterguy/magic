# Function; Remove role from user
FUNCTION ==> remove-from-role

This function removes the association between the specified [username] user and the specified [role].

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/users_roles/remove-from-role.hl]:
{
  "username": "[STRING_VALUE]",
  "role": "[STRING_VALUE]"
}
___
```

Arguments:

* `username` is mandatory
* `role` is mandatory
