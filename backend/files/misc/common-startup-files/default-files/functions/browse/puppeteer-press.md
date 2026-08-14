# Function; Puppeteer press
FUNCTION ==> puppeteer-press

Presses a key on a selector.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-press.hl]:
{
  "session_id": "[STRING_VALUE]",
  "selector": "[STRING_VALUE]",
  "key": "[STRING_VALUE]",
  "delay": 25
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `selector` is mandatory and the CSS selector to focus
* `key` is mandatory and is the key name to press
* `delay` is optional and is the delay in milliseconds
