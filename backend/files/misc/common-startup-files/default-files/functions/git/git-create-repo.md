# Function; Git Create Repo
FUNCTION ==> git-create-repo

Creates and initialises a new Git repository locally.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-create-repo.hl]:
{
  "path": "[STRING_VALUE]",
  "branch": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.
* `branch` is the optional default branch for repository. Defaults to 'main'.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
 