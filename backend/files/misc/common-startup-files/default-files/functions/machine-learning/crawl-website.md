# Function; Crawl website
FUNCTION ==> crawl-website

The following function can be used to crawl a website for training data and create RAG data for a machine learning type, AI chatbot, or AI agent.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/crawl-website.hl]:
{
  "type": "[STRING_VALUE]",
  "url": "[STRING_VALUE]",
  "max": [INTEGER_VALUE]
}
___
```

Arguments:

- `type` is mandatory name of machine learning type to store training data into
- `url` is mandatory URL of website to crawl for RAG training data
- `max` is optional maximum number of pages to crawl. Defaults to 25 unless specified

Notice, this function will retrieve the robots.txt file, and the sitemap of the website, and crawl and scrape `max` amount of pages and create individual RAG training snippets it inserts into the machine learning type. The function will determine itself automatically what pages to scrape, based upon the sitemap.

**IMPORTANT** - Once crawling is done the machine learning type needs to be vectorized to become capable of using the RAG data.
