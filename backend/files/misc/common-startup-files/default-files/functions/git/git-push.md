# Function; Git Push
FUNCTION ==> git-push

Pushes all changes to Git repository upstreams.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-push.hl]:
{
  "path": "[STRING_VALUE]",
  "remote": "[STRING_VALUE]",
  "branch": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.
* `remote` is optional remote value. Defaults to 'origin'.
* `branch` is optional branch to push. Defaults to 'main'.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".

Notice, before pushing a repo the repo must have a remote. You can add a remote upstream using the `git-add-remote` function.
 