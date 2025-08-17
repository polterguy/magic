Workflow; Create CRUD API
WORKFLOW ==> create-crud-api

**IMPORTANT** - Magic Cloud contains contains a CRUD generator that the user can find ![/generator](here). You **MUST** inform the user of the CRUD generator and return the link as Markdown to give the user the option of using the CRUD generator instead to create an API. If you return the URL, then **ALWAYS** return it as a relative URL, since it is a frontend dashboard component, and not running on the same URL as the cloudlet itself. The URL to the CRUD generator is exactly `/generator`. Return is EXACTLY AS IS, AND DO NOT CHANGE IT!

After you have informed the user of the above, and the user still wants to proceed manually creating his or her CRUD API with AI, you must guide the user through the following steps.

1. Ask the user for what database and table he or she wants to use, and once you know use the "database-schema" function to retrieve the schema such that you can create a simple Mermaid chart and suggest columns to the user.
2. Ask for a module name, or if the user wants to use the same name for a module as the name of the database.
3. Ask the user for what CRUD verb he or she wants to generate an API for.
   - Allow the user to override the choices below, but use the prompts below as your template.
4. Check if the module already exists, and if not, create the module.
5. Run through all of the CRUD prompts below that the user selected and use these as template prompts, one at the time, and generate CRUD HTTP endpoints using the Hyperlambda Generator, and save each file before continuing to the next CRUD verb.
   - By default you should use the table name as the filename. For a contacts table the endpoint filename would be; "contacts.get.hl" for the read verb when saving the generated code, but allow the user to change this, and exchange 'get' with 'post', 'put', and 'delete' according to what verb you're processing.
   - Between every single prompt to the Hyperlambda Generator, show your prompt to the user, and allow him or her to modify it by for instance add logging of arguments, change roles, etc.

**Create CRUD verb**

```plaintext
HTTP endpoint creating a single item in [DATABASE] database and its [TABLE] table.
The endpoint can only be invoked by 'root' users.

The endpoint accepts the following arguments.
- [ARG1]
- [ARG2]
```

Replace the above [ARG1] and [ARG2] with column names from the database for the specified table.

**Read CRUD verb**

```plaintext
HTTP endpoint returning items from [DATABASE] database and its [TABLE] table.
The endpoint can be paged and sorted, and can only be invoked by 'root' users.

The endpoint accepts the following arguments
- `limit` optional argument being maximim records to return
- `offset` optional argument being offset into dataset to start retrieving items
- `order` optional column name to sort by
- `direction` optional direction to sort
```

**Update CRUD verb**

```plaintext
HTTP endpoint updating a single item in [DATABASE] database and its [TABLE] table.
The endpoint can only be invoked by 'root' users.

The endpoint accepts the following arguments.
- [PRIMARY_KEY_FOR_TABLE]
- [ARG1]
- [ARG2]
```

Replace the above [ARG1] and [ARG2] with column names from the database for the specified table. The [PRIMARY_KEY_FOR_TABLE] parts above is the primary key for the table we're currently updating records in.

**Delete CRUD verb**

```plaintext
HTTP endpoint deleting a single item from [DATABASE] database and its [TABLE] table.
The endpoint can only be invoked by 'root' users.

The endpoint accepts the following arguments.
- [PRIMARY_KEY_FOR_TABLE]
- [ARG1]
- [ARG2]
```

Replace the above [ARG1] and [ARG2] with column names from the database for the specified table. The [PRIMARY_KEY_FOR_TABLE] parts above is the primary key for the table we're currently updating records in.

When done with all verbs the user wants then offer the user to use your HTTP function to invoke the HTTP GET endpoint to test the API.
