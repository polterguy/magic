
# Your misc folder

This folder contains module miscellaneous files, such as SQL scripts to create your Magic
database, etc.

The default docker-compose.yml file does _not_ mount this folder as a volume, implying changes to files and
folders within this folder will _not_ be persisted as you update your magic-backend Docker image, and/or
stop your container.

This implies any files inside of this folder will be overwritten when you restart, and/or update your
docker image. To have files that are persisted across updates, you should instead use the _"/etc/"_ folder.
