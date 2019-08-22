
# An example CRUD TODO app

This is a small CRUD example created using Magic. The application serves only as an example CRUD app, wrapping
and existing database, and is not intended to be used as is. To run it successfully, you'll need to modify your
_"MySQLConnection"_ connection string in the _"appsettings.json"_ file in the root of _"magic.backend"_.
In addition you'll need a database, with at least one table, named _"items"_, where at least the table
contains the following columns.

* id - Primary key, auto increment integer field
* subject - Subject for item, text field
* done - If item has been done, integer field
