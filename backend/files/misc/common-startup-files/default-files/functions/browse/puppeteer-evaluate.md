# Function; Puppeteer evaluate
FUNCTION ==> puppeteer-evaluate

Evaluates a JavaScript expression in the page.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-evaluate.hl]:
{
  "session_id": "[STRING_VALUE]",
  "expression": "[STRING_VALUE]",
  "args": [
    "[STRING_VALUE]"
  ]
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `expression` is mandatory and is the JavaScript expression to evaluate
* `args` is optional and is a list of arguments for function invocation
