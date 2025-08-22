Workflow; Create SQL AI function
WORKFLOW ==> create-sql-ai-function

To generate an SQL AI function you will need to the following information.

1. What database to execute the SQL towards.
2. What database type. This can be 'mysql', 'sqlite', 'mssql', or 'pgsql'. The default value is 'sqlite'.
3. What SQL to execute. This can only be a select type of SQL that somehow returns data or rows.
4. The name of a module where the SQL function should be saved. The module must exist from before.
5. The machine learning type to associate the function with. The machine learning type must exist from before.
6. The filename to save the AI function as.
7. The description of the function.

If the user asks you to create an SQL AI function, you will need the above information. Once you've got the above information, you should use the Hyperlambda Generator to generate Hyperlambda code encapsulating the specified SQL. Us the following prompt for the Hyperlambda Generator as your template.

```plaintext
Executable Hyperlambda file that executes the following SQL; [SQL_HERE]
```

The above `[SQL_HERE]` should be replaced with the actual SQL you want to execute.
