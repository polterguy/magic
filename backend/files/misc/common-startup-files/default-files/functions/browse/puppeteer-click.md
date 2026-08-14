# Function; Puppeteer click
FUNCTION ==> puppeteer-click

Clicks a selector.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-click.hl]:
{
  "session_id": "[STRING_VALUE]",
  "selector": "[STRING_VALUE]",
  "button": "left",
  "click_count": 2,
  "delay": 25
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `selector` is mandatory and the CSS selector to click
* `button` is optional and can be `left`, `middle`, or `right`
* `click_count` is optional and is the number of clicks
* `delay` is optional and is the delay between down and up in milliseconds
