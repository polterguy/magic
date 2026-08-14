# Function; Delete folder
FUNCTION ==> delete-folder

Deletes the specified [folder] folder.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/delete-folder.hl]:
{
  "folder": "[STRING_VALUE]"
}
___
```

Arguments:

- `folder` is the mandatory name of the folder to delete.

Notice, you can only delete folders inside the "/etc/" or the "/modules/" folders.

**Warning**! This action is permanent and user needs to acknowledge he understands the consequences.
