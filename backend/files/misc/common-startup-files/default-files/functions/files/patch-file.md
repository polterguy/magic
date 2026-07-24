# Function; Patch file
FUNCTION ==> patch-file

Applies a unified diff patch to an existing file.

Use this function only for small, targeted edits to an existing file after you have read the exact current file content. Use `create-file` when creating a new file, when replacing an entire file, or when you are not certain you can produce an exact patch.


Below is the exact function signature and JSON invocation format for this function.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/patch-file.hl]:
{
  "filename": "[STRING_VALUE]",
  "patch": "[STRING_VALUE]"
}
___
```

## Arguments

* `filename` is the mandatory filename and must be a fully qualified path, such as for instance "/modules/foo/bar.hl".
* `patch` is the mandatory unified diff patch to apply.

Notice, you can only patch files in the "/etc/" and "/modules/" folders.

## Patch format rules

The patch parser accepts a strict single-file subset of unified diff format. It is intentionally deterministic and less tolerant than Git-style patch application. Hunks are positioned by matching their context lines against the file, so if you guess context or newline state, the patch will fail.

* The patch must target **exactly one file**.
* The patch should be generated only after reading the current file content exactly as it exists now.
* Optional file headers are supported using `---` and `+++`. If present, they must refer to the same target file.
* Each hunk must start with a header line in the format `@@ -a,b +c,d @@`.
* Hunk headers may also omit counts for single-line changes, for example `@@ -5 +5 @@`.
* Every line inside a hunk must begin with one of these characters:
  * ` ` (space) for context lines. The leading space is mandatory.
  * `-` for deletions
  * `+` for additions
  * `\` only for the exact line `\ No newline at end of file`
* Empty lines inside a hunk must still be represented as diff lines with a prefix character such as ` `, `-`, or `+`.
* Context lines must match the file content **exactly**, otherwise the patch will fail.
* Every hunk must contain at least **2 context lines**, and its context must identify **exactly one** position in the file — an ambiguous hunk fails. Prefer 2 unchanged context lines above and 2 below the changed lines. If the file is too small to provide 2 exact context lines, use `create-file` instead.
* The line numbers and counts in the hunk header are **not** used to position the hunk — only the context lines are. The header must still be well-formed.
* Hunks must appear in order and must not overlap.
* If the file ends without a trailing newline and the patch changes the final line, you should include the exact marker `\ No newline at end of file` where needed.

## Required workflow for LLMs

When using this function, follow this workflow exactly:

1. Read the file first.
2. Create the patch using the exact loaded content
3. Copy the original lines for the hunk context exactly, including whitespace.
4. Include at least 2 unchanged context lines above and below each change whenever possible, and make sure the context is unique within the file.
5. Emit a well-formed hunk header; the hunk is positioned by its context lines, not by the header's line numbers.
6. Emit a single-file unified diff patch.
7. If you are not fully certain the patch metadata is exact, do **not** use `patch-file`. Use `create-file` instead.

## When not to use patch-file

Do **not** use `patch-file` in these situations:

* You have not read the current file contents first.
* You are changing large parts of the file.
* You are reformatting, reorganizing, or rewriting a file substantially.
* You cannot reproduce the exact context lines or the newline state.
* You cannot preserve exact surrounding context lines, including at least 2 lines above and/or below the change when available.

In these cases, use `create-file` and write the full intended content instead.

### Minimal safe example

The following illustrates the most reliable format for a single-line change, with unchanged context above and below the edited line.

```
@@ -5,5 +5,5 @@
 Context line above 2
 Context line above 1
-Old line here
+New line here
 Context line below 1
 Context line below 2
```

### Example with file headers

```diff
--- a/etc/www/site.css
+++ b/etc/www/site.css
@@ -10,5 +10,5 @@
 .product-card {
   width: 100%;
-max-width: 420px;
+max-width: 520px;
   margin: 0 auto;
 }
```
