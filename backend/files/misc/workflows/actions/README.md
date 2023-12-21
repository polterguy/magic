
# Hyperlambda workflow actions

This folder contains Hyperlambda workflow actions. An _"action"_ provides high level
building blocks for workflows, allowing you to chain together collections of actions, that for the most parts
declaratively instructs your backend how to execute a workflow. Think of them as _"chained high level functions"_,
where the implementation details are hidden, and your job is to supply the correct input, chaining the result
of the invocation of one action to your next action, resulting in an _"execution flow"_ of high level building
blocks. An action is declared as follows. 

```
/*
 * File comment, becomes the description of your action.
 * Describe what your action is doing here ...
 */
.arguments

   // Argument declarations.

.icon:SOME_ICON

// Action content here.

// Returning result to caller.
yield
   result:ACTION_RESULT
```

An action is _invoked_ as follows.

```
/*
 * Invokes ChatGPT with the specified [messages].
 * 
 * Will use the default API key found from configurations.
 */
execute:magic.workflows.actions.execute
   name:ACTION_NAME
   filename:/misc/workflows/actions/ACTION_NAME.hl
   arguments

      // Arguments to your action goes here
```

Because actions are declaring arguments they can handle very well, this allows for meta programming constructs,
where you declare your workflows using GUI constructs instead of code.

## Toolbox and GUI programming

In Hyper IDE you will find your _"toolbox"_. The toolbox is dynamically populated according to what Hyperlambda files
you have in your _"/misc/workflows/actions/"_ folder. Each of these files are assumed to be actions, and you can
use GUI constructs for the most parts to decorate your action invocations. Since Hyperlambda is based upon lambda
expressions, you can easily reference results of your previous actions in your consecutive actions, allowing you to
use the result of one action as the input to your next action.

Below is a screenshot of how to _"decorate"_ an action.
