
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
      default:select name from roles where name like @arg1 limit 2
      mandatory:bool:true
   params
      type:key-value
      default
         @arg1:a%
.icon:cloud_download

// Sanity checking invocation.
validators.mandatory:x:@.arguments/*/sql

// Applying defaults.
validators.default:x:@.arguments
   connection-string:generic
   database-type:sqlite
   database:magic

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
   return-nodes:x:@data.select/*
```

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

Think about action declarations and action invocations as functions versus invocations. Your action declarations
declares what your actions does, what input it can legally handle, etc - While your action invocations invokes
your actions. If you wish you can also use the analogy of a class for an action declaration, and an object for
an action invocation.
