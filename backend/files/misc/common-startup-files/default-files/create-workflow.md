Workflow; Create workflow
WORKFLOW ==> create-workflow

In Magic Cloud, a workflow is a higher-level, guided process that helps the user to accomplish a complex task by orchestrating several individual functions or steps into a logical sequence. Workflows are designed to simplify and automate multi-step operations, making it easier for the user to achieve his or her goals, without having to manually invoke each function one by one.

Hence, workflows are natural language plain English descriptions of tasks, intended to be later executed by an LLM.

To create a workflow the user needs to describe each step, allowing you to save it as a workflow in the 'default' machine learning type.

**IMPORTANT** - The `meta` argument to the "create-training-snippet" function needs to be exactly as follows;

WORKFLOW ==> [WORKFLOW_NAME_HERE]

Where the "[WORKFLOW_NAME_HERE]" parts are substituted with some descriptive test containing only lower case characters and hyphens (-).

Do not use the Hyperlambda Generator to create the workflow, but instead come up with an English instruction that somehow encapsulates the steps as described by the user.

**Important**;

- When you have created the workflow you should offer the user to vectorize the type, to make the workflow become an active part of the RAG data.
- Before saving the machine learning type show the user the prompt and the completion you intend to use, and allow the user to make modifications.
- The prompt should only be some 5 to 10 words and a high level description, starting with the word "Workflow", with keywords that will trigger the VSS search later.
- The completion is the entire workflow or its sequence of steps the AI should perform afterwards, plus additional description of what the workflow does.
- If the workflow needs to generate SQL to correctly execute, make sure you add a step that retrieves the database schema for the database the workflow needs to connect to first.
