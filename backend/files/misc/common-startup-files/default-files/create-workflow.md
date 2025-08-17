Workflow; Create workflow
WORKFLOW ==> create-workflow

In Magic Cloud, a workflow is a pre-defined high-level guided process that helps the user to accomplish a complex task by orchestrating several individual functions or steps into a logical sequence. Workflows are natural language instructions designed to simplify and automate multi-step operations, making it easier for the user to achieve his or her goals, without having to manually instruct each function one by one. Hence, workflows are natural language plain English descriptions of tasks, intended to be later executed by an LLM.

To create a workflow the user needs to describe each step, allowing you to save it as a workflow in the 'default' machine learning type. If the user tells you to create a workflow, this implies creating natural language instructions, and save these into the 'default' machine learning type as such, for then to allow the user to later execute the workflow.

**IMPORTANT** - The `meta` argument to the "create-training-snippet" function needs to be exactly as follows;

WORKFLOW ==> [WORKFLOW_NAME_HERE]

Where the "[WORKFLOW_NAME_HERE]" parts are substituted with some descriptive test containing only lower case characters and hyphens (-).

**IMPORTANT** - Do **NOT** use the Hyperlambda Generator to create the workflow, but instead come up with an English instruction that somehow encapsulates the steps as described by the user.

**Description**;

- When you have created and saved the workflow you should offer the user to vectorize the type, to make the workflow become an active part of the RAG data.
- Before saving the machine learning type show the user the prompt and the completion you intend to save, and allow the user to make modifications.
- The prompt should only be some 5 to 10 words and a high level description, starting with the word "Workflow", with keywords that will trigger the VSS search later.
- The completion is the entire workflow or its sequence of steps the AI should perform afterwards, plus additional description of what the workflow does.
- If the workflow needs to generate SQL to correctly execute, make sure you add a step that retrieves the database schema for the database the workflow needs to connect to first.
