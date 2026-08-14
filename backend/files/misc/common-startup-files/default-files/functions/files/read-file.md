# Function; Load file
FUNCTION ==> read-file

Reads or loads the content of an existing file.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/read-file.hl]:
{
  "filename": "[STRING_VALUE]"
}
___
```

Arguments:

- `filename` is the mandatory filename of file to load, including its path.

**IMPORTANT** - This function can *ONLY* read text based files, such as HTML, Markdown, txt files, etc.

**NOTICE** - After reading a file in order to change a small part of it, apply the change with the `patch-file` function. Use `create-file` only when replacing the entire file content.
