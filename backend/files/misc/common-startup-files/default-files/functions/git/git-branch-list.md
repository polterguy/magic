# Function; Git Branch List
FUNCTION ==> git-branch-list

Lists branches in Git repository

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-branch-list.hl]:
{
  "path": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
 