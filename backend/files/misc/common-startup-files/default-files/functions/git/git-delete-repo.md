# Function; Git Delete Repo
FUNCTION ==> git-delete-repo

Deletes an existing Git repository on the local machine.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-delete-repo.hl]:
{
  "path": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
 