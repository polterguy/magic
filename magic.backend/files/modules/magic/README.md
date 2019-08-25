
# An example CRUD TODO app

This is a small CRUD example web API created using Magic. The application serves only as
an example app, wrapping an existing database, and is not intended to be used as is. To
run it successfully, you'll need to modify your _"magic"_ connection string in
your _"appsettings.json"_ file at the root of your _"magic.backend"_. In addition you'll
need a database, with at least one table, named _"items"_, where the table contains at
least the following columns.

* _"id"_ - Primary key, auto increment integer field
* _"subject"_ - Subject for item, text field
* _"done"_ - If item has been done, integer field

## Notice

This _"TODO"_ app does not use authentication or authorization. These are features that
must be explicitly added to it.

If you would rather want to use MS SQL instead of MySQL, this is easily accomplished by making
sure you invoke the **[magic.db.mssql.xxx]** slots instead of your **[magic.db.mysql.xxx]**
slots in your _"item.xxx.hl"_ files. If you do, obviously you must use a configuration
setting for its **[connection]** argument that points to a valid MS SQL database, having
a similar table structure as described above.

Below is a MySQL script that will automatically create your database table for you if
you wish.

```sql
CREATE DATABASE `magic`;
CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(45),
  `done` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The easiest way to test your TODO app, is by using the Angular frontend, and using its
_"Endpoints"_ component that you can find as you launch your Angular frontend in its menu.

By convention, you should probably make sure your endpoints ends up having a similar
structure as your database, implying _"database-name/table-name"_. For instance, this
app consumes a database called _"magic"_, and it uses a table called _"items"_ - Hence,
it therefor can be found under _"magic/items"_ over HTTP.
