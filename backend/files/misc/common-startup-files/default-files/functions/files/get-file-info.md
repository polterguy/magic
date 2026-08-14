# Function; Get file information
FUNCTION ==> get-file-info

Returns meta information about a specific Hyperlambda file, specifically its description being the file level comment (if existing), and what arguments the file can handle. Will return description as taken from file comment, in addition to a list of arguments the file can handle which are in name/type format.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/get-file-info.hl]:
{
  "filename": "[STRING_VALUE]"
}
___
```

Arguments:

* `filename` is the mandatory name of file to return meta information about.
