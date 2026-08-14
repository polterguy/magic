# Function; Git Pull
FUNCTION ==> git-pull

Pulls all changes from a remote.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-pull.hl]:
{
  "path": "[STRING_VALUE]",
  "remote": "[STRING_VALUE]",
  "branch": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.
* `remote` is optional named remote. Defaults to 'origin'.
* `branch` is the optional branch to pull. Defaults to 'main'.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
 