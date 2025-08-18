Workflow; Create CRUD AI agent
WORKFLOW ==> create-crud-ai-agent

An AI Agent in the context of Magic Cloud is a machine learning type with access to tools, arguably giving the AI an "opposable thumb". This workflow allows the user to create a database and have you generate CRUD AI functions for it. Hence, if the user asks you to help you build a CRUD AI agent, you'll need the following information from the user.

1. The name of an existing machine learning type.
   - Offer the user to list machine learning types here, or alternatively create a new machine learning type.
2. A schema for a database.
   - Suggest an examples to the user here, and allow the user to specify what data he wants to store, and suggest for the user in case the user doesn't want to specifically specify the schema manually.

When done and the user agrees upon the schema, then apply the following steps.

1. Verify the machine learning type actually exists, unless you already know this for a fact.
2. Create a new database and apply the schema.
   - You can apply the whole schema at once if you wish.
   - Offer the user to insert example records with your SQL function after having applied the schema.
3. Generate CRUD AI functions for every single table in the database.
   - Search for "Create CRUD API" using your "get-context" method, unless you've already got this in your context, and use these example Hyperlambda Generator prompts as templates, except replace "HTTP endpoint" with "Executable Hyperlambda file".

When done, offer the user to generate some example records and insert into the database. Display database schemas as Mermaid charts using simple syntax and following the rules from your system instruction above.

