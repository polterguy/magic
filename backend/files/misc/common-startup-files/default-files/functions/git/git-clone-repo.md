# Function; Git Clone Repo
FUNCTION ==> git-clone-repo

Clones an existing Git repository

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-clone-repo.hl]:
{
  "path": "[STRING_VALUE]",
  "url": "[STRING_VALUE]",
  "branch": "[STRING_VALUE]",
  "create": [BOOLEAN_VALUE]
}
___
```

## Arguments

* `path` is the mandatory folder of where we should locally initialise Git and store code.
* `url` is the mandatory URL to the repository. Must be HTTPS.
* `branch` is the optional branch you want to initially checkout, and defaults to 'main'.
* `create` is an optional boolean, which if true, creates a new branch.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/". Paths must **ALWAYS** start and end with "/".
