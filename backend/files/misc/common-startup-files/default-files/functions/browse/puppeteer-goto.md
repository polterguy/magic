# Function; Puppeteer goto
FUNCTION ==> puppeteer-goto

Navigates an existing Puppeteer session to a URL.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-goto.hl]:
{
  "session_id": "[STRING_VALUE]",
  "url": "[STRING_VALUE]",
  "timeout": 30000,
  "wait_until": "networkidle2"
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `url` is mandatory and the URL to navigate to
* `timeout` is optional and is the navigation timeout in milliseconds
* `wait_until` is optional and can be `load`, `domcontentloaded`, `networkidle0`, or `networkidle2`
