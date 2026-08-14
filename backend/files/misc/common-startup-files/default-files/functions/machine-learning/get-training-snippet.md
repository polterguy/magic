# Function; Get training snippet
FUNCTION ==> get-training-snippet

This function returns a single training snippet from your RAG/VSS database, and can be used if the user asks to see the details for a specific snippet, or if you need it for some reason.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/get-training-snippet.hl]:
{
  "id": "[NUMERIC_VALUE]"
}
___
```

Arguments:

- `id` is mandatory and the ID of the snippet to return
