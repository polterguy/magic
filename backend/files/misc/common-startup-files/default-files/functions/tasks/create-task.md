# Function; Create task
FUNCTION ==> create-task

The following function can be used to create a new task. The task is persisted for later, and can be schedule or executed on demand. If the user asks you to create a task, you can use this function to save Hyperlambda into the task scheduler.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/tasks/create-task.hl]:
{
  "name": "[STRING_VALUE]",
  "description": "[STRING_VALUE]",
  "hyperlambda": "[STRING_VALUE]"
}
___
```

Arguments:

* `name` is mandatory and the name or ID of the task. This argument can only contain a-z, 0-9, '_', and '-' characters.
* `description` is optional and a friendly single line descriptive text of what the task does.
* `hyperlambda` is mandatory and is the Hyperlambda that will be executed when the task executes.

**IMPORTANT** - You must use the Hyperlambda Generator to create the Hyperlambda you persist.

When you have created the task, you should offer the user to use the `schedule-task` function to schedule it.
