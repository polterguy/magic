# Function; Puppeteer type
FUNCTION ==> puppeteer-type

Types text into a selector.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-type.hl]:
{
  "session_id": "[STRING_VALUE]",
  "selector": "[STRING_VALUE]",
  "text": "[STRING_VALUE]",
  "config-key": "[STRING_VALUE]",
  "delay": 25
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `selector` is mandatory and the CSS selector to type into
* `text` is optional and the text to type
* `config-key` is optional and resolves the text value from configuration
* `delay` is optional and is the delay between key presses in milliseconds

**NOTICE** - Supply exactly one of `text` or `config-key`. Do not supply both.

**NOTICE** - For passwords and other secrets, prefer `config-key` such that the secret value does not have to be exposed to the LLM.
