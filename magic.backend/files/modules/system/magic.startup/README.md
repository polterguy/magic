
# Startup files for your system module

The files inside of this folder, and its sub folders, will be automatically evaluated by
Magic as it starts. This is because the folder name is _"magic.startup"_. If you create a
module, and you create a sub folder inside of it, having the name of _"magic.startup"_,
then all files inside of that folder will be evaluated as the system starts.

This is useful to for instance create globally accessible slots, such as this folder is
an example of, since it creates a range of MS SQL and MySQL slots, helping you do CRUD
operations towards these two database systems respectively.
