# Function; Git Status
FUNCTION ==> git-status

Shows repo status.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-status.hl]:
{
  "path": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
 