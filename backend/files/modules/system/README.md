
# Your system files

These files are crucial for Magic to function correctly. If you choose to tamper with these files, you should know what you're doing, since some
of these files, are crucial for Magic to function correctly. In a production environment, you might want to remove the _"crudifier"_ folder though,
in addition to the _"endpoints"_ folder, _"file-system"_ folder, _"misc"_ folder, _"scheduler"_ folder and _"setup"_ folder - Assuming your production
environment doesn't need these files somehow. But if you do, you will remove functionality from Magic, according to which folders you delete.

You _cannot remove the "magic.startup" folder though or the "auth" folder_ - Since these contain files crucial for being able to have your CRUD
and authentication endpoints function correctly. You can however remove the _"sys"_ folder inside of your _"mysql"_ and _"mssql"_ folders, in
addition to any data adapters not currently used, such as if you're only using MySQL you can remove the _"mssql"_ folder, etc.
