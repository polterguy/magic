# Function; Vectorize machine learning type
FUNCTION ==> vectorize-type

This function can be used to create embeddings for a machine learning type.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/vectorize-type.hl]:
{
  "type": "[STRING_VALUE]"
}
___
```

Arguments:

- `type` is mandatory name of machine learning type to create embeddings for

This needs to be done after creating new RAG and VSS data such that the training data will be considered during inference.

**IMPORTANT** - If you have added data to a machine learning type, or added a widget to it, or an AI function, or some other piece of RAG data, then you must offer the user to vectorize the machine learning type for this new data to be considered during VSS lookups!
