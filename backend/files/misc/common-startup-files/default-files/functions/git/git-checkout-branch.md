# Function; Git Checkout Branch
FUNCTION ==> git-checkout-branch

Checks out an existing Git branch

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/git/git-checkout-branch.hl]:
{
  "path": "[STRING_VALUE]",
  "branch": "[STRING_VALUE]",
  "create": [BOOLEAN_VALUE]
}
___
```

## Arguments

* `path` is the mandatory folder of where your repository is.
* `branch` is the mandatory branch you want to checkout.
* `create` is an optional boolean, which if true, creates a new branch.

Notice, you can only save files in the "/etc/" and "/modules/" folders, so the `path` argument must point inside of "/etc/" or "/modules/".
