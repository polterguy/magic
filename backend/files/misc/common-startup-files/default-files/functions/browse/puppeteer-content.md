# Function; Puppeteer content
FUNCTION ==> puppeteer-content

Returns the page HTML.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-content.hl]:
{
  "session_id": "[STRING_VALUE]"
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id

**NOTICE** - Only resort to this function if absolutely necessary to solve some problem, since it will return ALL HTML, which might be too much for you to digest. Prefer instead the function named `puppeteer-evaluate` if you know how to narrow your search for content or values in the page.
