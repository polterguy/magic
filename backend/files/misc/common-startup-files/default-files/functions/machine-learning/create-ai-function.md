# Function; Create AI function
FUNCTION ==> create-ai-function

The following function can be used to create an AI function for a machine learning type, allowing the LLM to have access to it as a tool in its RAG/VSS database, or as a part of its system instruction.
```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/machine-learning/create-ai-function.hl]:
{
  "type": "[STRING_VALUE]",
  "prompt": "[STRING_VALUE]",
  "completion": "[STRING_VALUE]",
  "filename": "[STRING_VALUE]",
  "system_instruction": [BOOLEAN_VALUE]
}
___
```

Arguments:

- `type` is mandatory name of machine learning type to add the function to.
- `prompt` is mandatory descriptive text / command of what function does.
- `completion` is mandatory description (multi line, exhaustive) of what function does, and more important a natural language based description of **when** the function should be used.
- `filename` is mandatory Hyperlambda file path, to the file that's to serve as the function.
- `system_instruction` is optional. If true, will add the function declaration to the system instruction instead of as RAG data.

If you add the ai function to the system instruction it will always be available, even when the user does not provide a natural prompt that matches the RAG snippet. The default value here is "false", but ask the user if he wants to add it to the system instruction for higher availability, especially if it seems to be an important AI function that the LLM needs to have access to always.

The above `prompt` should be 2/5 words, and a simple "description command phrase" such as for instance; "Send Email", or "Create Contact in HubSpot", while the description should be an exhaustive description of what the function does, but also more important a description of **WHEN** the function should be used, to allow the LLM that's consuming the function to understand when it should be invoked, and how, and what it returns (if anything).

**IMPORTANT** - The Hyperlambda file must exist before you invoke this function. If you've just generated Hyperlambda for the AI function then you must save the file first with the `create-file` function, before you execute this function.

**IMPORTANT** - Before you can save the file, you must verify that the module exists with the `list-modules` function, and if it doesn't you must create it first with the `create-module` function.

**CRUCIAL** - Before you create an AI function for a Hyperlambda file, it is absolutely necessary for you to first load the file using `read-file` unless you already have it in your context, such that you understand how to correctly describe it, and its arguments. And if you choose to describe the file, then focus on the input arguments, what it returns, and what it changes. Document the file INTENTIONALLY!
