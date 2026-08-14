# Function; Scrape URL for Markdown
FUNCTION ==> scrape-url

This function will scrape the specified `url` and return its content as Markdown, in addition to a list of all URLs found inside of the section that was transformed. 

```plaintext
___
FUNCTION_INVOCATION[/system/workflows/workflows/scrape-url.hl]:
{
  "url": "[VALUE]"
}
___
```

Arguments:

* `url` is mandatory and the URL that will be scraped

Notice, if the user asks you to scrape for anything else than Markdown, such as H1 headers, title elements, etc, then do not use this function but rather offer the user to generate Hyperlambda code using the `generate-hyperlambda` function.
