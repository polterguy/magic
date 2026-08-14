# Function; Create folder
FUNCTION ==> create-folder

Creates a folder for the specified [folder].

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/create-folder.hl]:
{
  "folder": "[STRING_VALUE]"
}
___
```

Arguments:

* `folder` is the mandatory name of the folder that should be created.

Notice, you can only create new folders inside the "/etc/" and "/modules/" folders.
