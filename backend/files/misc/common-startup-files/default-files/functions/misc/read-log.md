# Function; Read the log
FUNCTION ==> read-log

The following function can be used to read the most recent entries from the log, newest first.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/read-log.hl]:
{
  "max": "[INTEGER_VALUE]"
}
___
```

Arguments:

- `max` is the optional number of entries to return. Defaults to 10.

Each entry contains its id, its type of either info, error, fatal or debug, when it was created, its content, and for errors the full exception. A Hyperlambda exception names the file and the exact position in the lambda object where execution stopped, which makes this the fastest way to understand why an endpoint or a Hyperlambda file failed.

Use this function after something fails, instead of guessing at the cause.
