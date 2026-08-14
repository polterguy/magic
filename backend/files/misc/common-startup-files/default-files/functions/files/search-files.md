# Function; Search files
FUNCTION ==> search-files

Searches recursively through a folder for file containing specified pattern.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/search-files.hl]:
{
  "path": "[STRING_VALUE]",
  "pattern": "[STRING_VALUE]",
  "extensions": "[STRING_VALUE]",
  "regex": [BOOLEAN_VALUE]
}
___
```

Arguments:

- `path` is the mandatory folder to search through.
- `pattern` is the mandatory pattern to search for.
- `extensions` is an optional filter for file extensions to search through, e.g. '.cs,.hl,.txt' for instance.
- `regex` if true, implies the pattern is a regular expression. Defaults to false.
