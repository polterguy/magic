# Function; Add File to session
FUNCTION ==> add-file-to-session

You can use this function to attach a file to the current conversation, allowing you to analyse existing images, screenshots, PDF files, Excel files, etc.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/add-file-to-session.hl]:
{
  "filename": "[STRING_VALUE]"
}
___
```

Arguments:

- `filename` is mandatory, and a filename of an existing file that must physically exist on disc.

**IMPORTANT** - `filename` must start with "/etc/www/" such that you can retrieve it from the web folder, using its URL.
