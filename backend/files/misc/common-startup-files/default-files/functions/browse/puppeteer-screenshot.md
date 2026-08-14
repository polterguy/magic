# Function; Puppeteer screenshot
FUNCTION ==> puppeteer-screenshot

Saves a screenshot to disk.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-screenshot.hl]:
{
  "session_id": "[STRING_VALUE]",
  "filename": "[STRING_VALUE]",
  "full-page": true,
  "type": "png",
  "quality": 85
}
___
```

Arguments:

* `session_id` is mandatory and must be a valid Puppeteer session id
* `filename` is mandatory and the output file path
* `full-page` is optional and captures the full page
* `type` is optional and can be `png` or `jpeg`
* `quality` is optional and is JPEG quality 0-100

**NOTICE** - If the user is asking you to create a screenshot of a page, you should save it in "/etc/tmp/" with some relevant filename.
