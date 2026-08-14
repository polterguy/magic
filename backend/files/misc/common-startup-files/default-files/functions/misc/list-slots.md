# Function; List slots
FUNCTION ==> list-slots

The following function can be used to list every slot that exists on this instance, each with its description.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/list-slots.hl]:
{
  "filter": "[STRING_VALUE]"
}
___
```

Arguments:

- `filter` is an optional prefix, returning only the slots whose names start with it, e.g. `strings.` or `io.file.`.

Execute this before writing Hyperlambda, to know which capabilities exist here. A slot that is not in this list does not exist on this instance, and code referencing it will fail. Never guess at slot names.
