# Function; Git Fetch
FUNCTION ==> git-fetch

Fetches all changes from a remote.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-fetch.hl]:
{
  "path": "[STRING_VALUE]",
  "remote": "[STRING_VALUE]",
  "refspec": "[STRING_VALUE]"
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.
* `remote` is optional named remote. Defaults to 'origin'.
* `refspec` is optional refspec to fetch.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
 