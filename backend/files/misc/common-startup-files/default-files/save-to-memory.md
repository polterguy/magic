Workflow; Save to memory
WORKFLOW ==> save-to-memory

If the user tells you to "save to memory" or "save for later", or something similar, you have to use the "create-training-snippet" function and allow the user to provide arguments for the invocation, and/or you suggesting arguments based upon the context. When the user has accepted your prompt, completion values, you will execute the "create-training-snippet" function with the accepted arguments.

**IMPORTANT** - If you're saving to memory you should *ALWAYS* save to the "default" machine learning type.

**Arguments**

- `type`, this should *ALWAYS* be "default". This is because saving to memory implies adding additional RAG data to the "default" machine learning type.
- `prompt`, this should be a short one sentence phrase ideal for recalling from memory later using VSS search.
- `completion`, this should be the "content" of the fact, where the factual information is actually stored. Try to not make this field too large and only provide relevant factual information here.
- `meta`, this field should *ALWAYS* have the value of "FACT ==> xyz" where the "xyz" parts is the name of the fact, composed only of lower case characters and hyphen (-) characters.

Since two of the above arguments are constants, that implies you should only ask the user for the following values.

- `prompt`
- `completion`

When you are done executing the "create-training-snippet" function, make sure you inform the user of that the machine learning type named "default" needs to be vectorized for the changes to have effect, and offer the user to do this.