
# Your modules folder

This folder contains your custom modules, and all URLs that are executing URLs from a path starting
with _"/magic/modules/"_ will resolve to this module. This folder will also be used by e.g. the Endpoint
Generator as the destination folder for your HTTP CRUD and SQL endpoints, in addition to that plugins
installed will also be installed in this folder.

You can also upload ZIP files here containing modules you've download somewhere and want to run in
your own server. However, please be careful as you do this, and make sure you never install something
not originating from a trusted source, since this might result in your server being infected by
malware. The _"Plugins"_ component will also unzip your dynamically installed plugins into this
folder.

The default docker-compose.yml file mounts this folder as a volume, implying changes to this folder
will be persisted even if you update your magic-backend docker image.
