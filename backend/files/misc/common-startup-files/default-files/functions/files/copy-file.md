# Function; Copy file
FUNCTION ==> copy-file

Copies an existing file.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/copy-file.hl]:
{
  "source": "[STRING_VALUE]",
  "destination": "[STRING_VALUE]"
}
___
```

## Arguments

* `source` is the mandatory source file to copy.
* `destination` is the mandatory full destination path.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `destination` argument must point inside of "/etc/" or "/modules/".
