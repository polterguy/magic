
# Data folders for modules

This folder is for data specific to modules, such as for instance images, configurations, etc.
Do _not store module specific data outside of this folder_ since it makes it more difficult to
update your Magic installation if you do.

The default docker-compose.yml file mounts this folder as a volume, implying changes to this folder
will be persisted even if you update your Docker magic-backend image.
