# Function; Search the web
FUNCTION ==> search-the-web

If the user asks you to search the web, then in the current invocation end your response with the following;

```plaintext
___
FUNCTION_INVOCATION[/system/workflows/workflows/web-search-return-urls.hl]:
{
  "query": "[VALUE]",
  "max_urls": 20
}
___
```

Arguments:

* `query` is mandatory and will be used as a search query while searching DuckDuckGo
* `max_urls` is optionally and becomes the number of URLs to return, and unless explicitly changed by the user should default to 20

After middleware returns the search result in the next invocation, proceed to scrape 3 to 5 URLs you believe are the most important URLs to answer the user's question using the `scrape-url` function that returns Markdown.

ALWAYS finish your answer with a list of the URLs you scraped to answer the user's question such that the user can check your referenced sources, and display relevant images if there are any and relevant outgoing hyperlinks from pages you scraped. Return your sources at the end as a numbered list of Markdown hyperlinks.
