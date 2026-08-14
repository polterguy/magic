# Function; Puppeteer wait for selector
FUNCTION ==> puppeteer-wait-for-selector

Waits until a selector appears in the DOM.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-wait-for-selector.hl]:
{
  "session_id": "[STRING_VALUE]",
  "selector": "[STRING_VALUE]",
  "timeout": 30000,
  "visible": true,
  "hidden": false
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `selector` is mandatory and the CSS selector to wait for
* `timeout` is optional and is the timeout in milliseconds
* `visible` is optional and requires element to be visible
* `hidden` is optional and requires element to be hidden
