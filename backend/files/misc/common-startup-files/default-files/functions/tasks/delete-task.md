# Function; Delete task
FUNCTION ==> delete-task

The following function can be used to delete a specific task.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/tasks/delete-task.hl]:
{
  "name": "[STRING_VALUE]"
}
___
```

Arguments:

- `name` is mandatory name or ID of task to delete

**Warning**! This action is permanent and user needs to acknowledge he or she understands the consequences.
