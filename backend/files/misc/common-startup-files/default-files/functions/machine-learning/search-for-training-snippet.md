# Function; Search for training snippet
FUNCTION ==> search-for-training-snippet

This function allows you to search for training snippets using VSS search. The distance is the similarity score, implying the smaller the number the closer match.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/search-for-training-snippet.hl]:
{
  "type": "[STRING_VALUE]",
  "query": "[STRING_VALUE]"
}
___
```

Arguments:

- `type` is mandatory name of machine learning type to search in
- `query` is mandatory query to search for
