
# Hyperlambda modules

This is where you Hyperlambda modules should exist, implying files that can be _"executed"_ over HTTP REST
endpoints. You should try to logically separate your files into folders, where the root folder name is the
name of the application you're creating. The following file for instance.

* _"/modules/crm/customers.get.hl"_

Will be accessible over an HTTP GET endpoint with the following URL.

* _"/api/endpoint/crm/customers"_

A URL can only contain the letters [a-z], [0-1] and '-'. This allows you to create folders with names
containing for instance characters such as _"."_ or "_", to create hidden implementation files inside
your module's root folder. These files can still be executed by your internal Hyperlambda files, but
cannot be reached from a URL. The following explains the URL and its relationship to the filenames on
your server.

* _"/modules/folder(s)/filename.{http-verb}.hl"_

Magic support the following verbs.

* get
* post
* put
* delete

This allows you to create a file called e.g. _"foo.delete.hl"_ that will be automatically evaluated when
the last part of the URL is _"foo"_ and the HTTP verb supplied is _"delete"_, assuming the foldername and
the previous parts of the URL matches. Notice, all HTTP verbs when it comes to filenames should be written
with small letter, without CAPS.

By default Magic contains one simple module, that will insert into a MySQL database table with the name
of _"todo"_. This only serves as an example module, and should be replaced with your own logic.
