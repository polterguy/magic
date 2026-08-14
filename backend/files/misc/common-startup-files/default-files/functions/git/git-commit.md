# Function; Git Commit
FUNCTION ==> git-commit

Commits all changes to the local Git repository.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-commit.hl]:
{
  "path": "[STRING_VALUE]",
  "message": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.
* `message` is the mandatory message for the commit.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
 