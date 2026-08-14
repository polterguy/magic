# Function; Create RAG training snippet for machine learning type
FUNCTION ==> create-rag-training-snippet

The following function can be used to create RAG training data for a machine learning type. If the user wants you to create RAG or VSS data for a specific machine learning type, AI chatbot, or AI agent, then you must end your response with the following;

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/create-training-snippet.hl]:
{
  "type": "[STRING_VALUE]",
  "prompt": "[STRING_VALUE]",
  "completion": "[STRING_VALUE]",
  "meta": "[STRING_VALUE]"
}
___
```

Arguments:

- `type` is mandatory name of machine learning type
- `prompt` is mandatory single sentence summary of completion
- `completion` is mandatory and the actual training data
- `meta` is optional meta information about training snippet
