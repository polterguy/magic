# Function; Puppeteer select
FUNCTION ==> puppeteer-select

Selects option values from a selector.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-select.hl]:
{
  "session_id": "[STRING_VALUE]",
  "selector": "[STRING_VALUE]",
  "values": [
    "[STRING_VALUE]"
  ]
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `selector` is mandatory and the CSS selector for a select element
* `values` is mandatory and is a list of option values to select
