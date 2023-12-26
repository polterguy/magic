
# Hyperlambda workflows

This folder contains Hyperlambda workflow actions and snippets. An _"action"_ provides high level
building blocks for workflows, allowing you to chain together collections of actions, that for the most parts
declaratively instructs your backend how to execute some piece of Hyperlambda. Think of workflows
as _"chained high level functions"_, where the implementation details are hidden, and your job is to
supply the correct input, chaining the result of the invocation of one action to your next action,
resulting in an _"execution flow"_ of high level building blocks, resulting in a _"workflow"_.

## Workflows

A workflow is a chained list of actions, where each action can reference results from executing previous actions,
and/or input arguments to the workflow itself. The purpose of a workflow is to lower the bar for creating backend
logic to such a significant extent, that also non-software developers can create computer logic and backend code.

A workflow can in theory be any Hyperlambda file, and workflows are not special in any ways, except they're
typically not built by writing code, but rather built using GUI building blocks to chain actions together.
This allows you to create workflows that are HTTP API endpoints, workflows intended to be executed as scheduled
tasks, etc. This makes Hyperlambda workflows _very_ powerful, allowing you to create almost anything you wish 
(in theory) using GUI building blocks, without having to manually write Hyperlambda.

## Actions

Actions are building blocks for workflows, and once chained together, at least in theory allows for declaratively
creating code without much software development experience. What actions your particular installation has might 
differ from installation to installation, but each Magic Cloud installation should be able to find at least some
actions in the _"Toolbox"_ component in Hyper IDE. Creating an action requires extensive knowledge about Hyperlambda,
but consuming an action should be significantly easier, since consuming actions typically are used using high
level GUI building blocks without having to understand its underlying code. However, consuming an action
still _produces_ code for you, which can be manually edited afterwards - But it is not necessary in general to
write Hyperlambda to consume actions and create workflows.

An action is declared as follows.

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

// Code actually executing your action goes here.
```

Because actions are declaring arguments they can handle very well, this allows for meta programming constructs,
where you declare your workflows using GUI constructs instead of code.

## Toolbox and GUI programming

In Hyper IDE you will find your _"toolbox"_. The toolbox is dynamically populated according to what Hyperlambda files
you have in your _"/misc/workflows/actions/"_ folder. Each of these files are assumed to be actions, and you can
use GUI constructs for the most parts to decorate your action invocations. Since Hyperlambda is based upon lambda
expressions, you can easily reference results of your previous actions in your consecutive actions, allowing you to
use the result of one action as the input to your next action.

Notice, there is nothing preventing you from combining actions and workflows with normal Hyperlambda code, since
workflows fundamentally are just plain Hyperlambda. However, if you add too much _"standard Hyperlambda code"_ to
your workflows, it becomes difficult to continue maintaining your code using GUI constructs, and you'll have
to manually edit your code to continue maintaining it. The workflow GUI is created explicitly to handle workflows
based upon actions, and doesn't do a very good job at describing standard Hyperlambda code.

It is therefor smart to separate your workflows from your standard Hyperlambda code, to ensure your workflows
becomes easily maintainable also by those without much prior Hyperlambda experience.

## Action arguments

An action can accept arguments as an **[.arguments]** collection. Below is an example of arguments for an SQL
execute type of action.

```
.arguments
   database-type
      type:enum
      default:sqlite
      mandatory:bool:true
      values
         .:sqlite
         .:mssql
         .:mysql
         .:pgsql
   connection-string
      type:string
      default:generic
      mandatory:bool:true
   database
      type:string
      default:magic
      mandatory:bool:true
   sql
      type:sql
      default:insert into roles (name, description) values (@name, @description)
      mandatory:bool:true
   params
      type:key-value
      default
         @name:some-role-name
         @description:Some role description
      mandatory:bool:false
```

The key is the name of the argument, such as for instance _"database-type"_ from above, and children nodes of each
argument declares meta data about your argument, such as its type, legal values, whether or not the argument is
mandatory or not, etc. There exists a whole range of argument types. Below is a list.

* key-value - A collection of key/value pairs
* array - Array of strings (can be converted to another type inside your action's implementation)
* string - Any arbitrary string
* int - Any arbitrary integer value
* textarea - Multi line string
* sql - SQL type of input
* csharp - C# type of input
* hyperlambda - Hyperlambda input
* email - Email address input

The type of argument declares how the user can provide a value for the argument, such as for instance _"email"_
having email validator logic to ensure user provides a valid email address. While SQL arguments will show a CodeMirror
SQL input editor with autocomplete on tables and columns if possible. Etc.

Your argument's _"default"_ declaration becomes the default value used unless user specifically override it with
his or her own value.

Mandatory will require the user to provide a value if it's true.

## An example action declaration

Below you can see a complete action declaration, including its arguments. This action executes an SQL statement
towards your database type and connection string, and returns the result as an array.

```
/*
 * Execute some select SQL statement specified as [sql].
 * Optionally provide [connection-string], [database-type] and [database].
 */
.arguments
   database-type
      type:enum
      mandatory:bool:true
      values
         .:sqlite
         .:mssql
         .:mysql
         .:pgsql
   connection-string
      type:string
      mandatory:bool:true
   database
      type:string
      mandatory:bool:true
   sql
      type:sql
      mandatory:bool:true
   params
      type:key-value
.icon:cloud_download

// Sanity checking invocation.
validators.mandatory:x:@.arguments/*/sql

// Connection string to actually use as we connect.
.connection-string

// Caller supplied an explicit [connection-string] argument.
set-value:x:@.connection-string
   strings.concat
      .:[
      get-value:x:@.arguments/*/connection-string
      .:|
      get-value:x:@.arguments/*/database
      .:]

// Connecting to database.
data.connect:x:@.connection-string
   database-type:x:@.arguments/*/database-type

   // Parametrizing SQL.
   add:x:./*/data.select
      get-nodes:x:@.arguments/*/params/*

   // Executing SQL.
   data.select:x:@.arguments/*/sql
      database-type:x:@.arguments/*/database-type

    // Returning result of SQL back to caller as an array.
   return-nodes:x:@data.select/*
```

## Example action invocation

If you use your toolbox to inject the above action into a workflow, it will end up looking as follows.

```
/*
 * Execute some select SQL statement specified as [sql].
 * Optionally provide [connection-string], [database-type] and [database].
 */
execute:magic.workflows.actions.execute
   name:sql-select
   filename:/misc/workflows/actions/sql-select.hl
   arguments
      database-type:sqlite
      connection-string:generic
      database:magic
      sql:select name from roles where name like @arg1 limit 2
      params
         @arg1:a%
```

## Action abstracts

Think of action declarations and action invocations as function declarations versus function invocations. Your
action declarations declares what your actions does, what input it can legally handle, contains its logic, etc -
While your action invocations invokes and consumes your actions. If you wish you can also use the analogy of a
class for an action declaration, and an object for an action invocation.

## Custom actions

You can easily create your own custom actions if you understand Hyperlambda. However, you would typically not
put your custom actions into this folder, but rather your _"/etc/workflows/actions/"_ folder. When your toolbox
is populated, the backend will return all actions in both of these folders to you.

* _"/etc/workflows/actions/"_
* _"/misc/workflows/actions/"_

So both your custom actions and your system actions will be returned and possible to use through your toolbox.
