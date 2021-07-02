
# Your modules folder

This folder contains your modules, and all URLs that are retrieving documents from a path starting
with _"/magic/"_ will resolve to this module. This folder will also be used by e.g. the crudifier
as the destination folder for your HTTP CRUD endpoints. In addition, it also contains your _"system"_
module folder, which is an especially protected folder, which you should be *very* careful with if
you choose to mess with, since it contains system files that Magic depends upon to function correctly.

You can also upload ZIP files here containing modules you've download somewhere and want to run in
your own server. However, please be careful as you do this, and make sure you never install something
not originating from a trusted source, since this might result in your server being infected by
malware. The _"Bazar"_ menu item will also unzip your dynamically instaleld Bazar apps into this
folder.
