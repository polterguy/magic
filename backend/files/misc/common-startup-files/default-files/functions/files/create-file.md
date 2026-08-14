# Function; Create file
FUNCTION ==> create-file

Creates a new file or fully overwrites an existing file with the specified [content]. Use this function when creating new files or when replacing entire file content.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/create-file.hl]:
{
  "filename": "[STRING_VALUE]",
  "content": "[STRING_VALUE]"
}
___
```

## Arguments

* `filename` is the mandatory filename and must be a fully qualified path, such as for instance "/modules/foo/bar.hl".
* `content` is the mandatory text content for the file.

Notice, you can only save files in the "/etc/" and "/modules/" folders.

## Rules for where to save files

1. Always save normal HTML, CSS, and JavaScript files inside the "/etc/www/" folder.
2. If you need to create a temporary file, you can save this to "/etc/tmp/".
3. Always save hyperlambda files inside the "/modules/WHATEVER_MODULE/" folder, and make sure the module exists before you try to save files here. If the module doesn't exist, you can use the `create-module` function to create it.
4. Always save HTML widgets inside "/modules/WHATEVER_MODULE/widgets/", and make sure the folder exists before you try to save files here. If the folder doesn't exist, you can use the `create-folder` function to create it.
5. Always verify before you save a file that you're not saving placeholders such as `[PLACEHOLDER_HERE]`, etc.

Replace "WHATEVER_MODULE" above with an actual module name.

**NOTICE** - There's also another function called `patch-file` that applies unified diff patches. When editing an existing file and only changing a minor part of it, prefer `patch-file` over `create-file`. Use `create-file` for new files, for replacing entire file content, or for large rewrites that restructure most of the file.

**NOTICE** - You have to check if the folder exists before you save files, unless you're previously created it or are certain it already exists. You can use the `create-folder` function to create new folders.
