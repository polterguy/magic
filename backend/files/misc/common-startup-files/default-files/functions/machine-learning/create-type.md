# Function; Create machine learning type
FUNCTION ==> create-type

The following function can be used to create a new machine learning type.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/create-type.hl]:
{
  "type": "[STRING_VALUE]",
  "system_message": "[STRING_VALUE]",
  "auth": "[STRING_VALUE]",
  "max_context_tokens": "[INTEGER_VALUE]",
  "use_embeddings": [BOOLEAN_VALUE]
}
___
```

Arguments:

- `type` is the mandatory name of machine learning type to create.
- `system_message` is optional and the system instruction used during inference.
- `auth` is an optional comma separated list of roles. The user must belong to at least one of these roles to be able to use the machine learning type.
- `max_context_tokens` is an optional value and is maximum number of tokens of RAG data and "context" that will be sent to OpenAI during requests.
  - If you're creating an AI agent it is typically better to set this at somewhere between 40,000 and 60,000
  - Defaults to 12,000 tokens.
- `use_embeddings` is an optional boolean value indicating if the type should use automatic embeddings or not.
  - For an AI chatbot intended for support, customer service, or AI assistant sales, this should typically be turned on.
  - For an AI agent, it should most of the time be turned off.

If the above `use_embeddings` is `false`, the machine learning type will be created as a "native AI agent" with meta functions, allowing it to search through its RAG data for function and information on a need to know basis, instead of having "automatic RAG" associated with every single prompt.

**IMPORTANT** - For an "AI agent" without much knowledge base, the above `use_embeddings` should almost always be `false`. This doesn't affect the decision whether or not the type should have its RAG data vectorised afterwards, since an AI agent is also typically created with meta search capabilities, relying upon embeddings for each individual item.

Notice, this function will add description for how to invoke AI functions to its system instruction automatically, allowing the LLM to execute functions and use tools - In addition to a couple of other boiler plate parts, such as how to display images, and how to respond with follow up questions, etc.
