
# Your misc folder

This folder contains your miscellaneous files, such as helper SQL scripts to create example databases, etc - In addition to
snippets files for MySQL and MS SQL, and other helper files.

The default docker-compose.yml file does NOT mount this folder as a volume, implying changes to files and folders within
this folder will _not_ be persisted as you update your magic-backend Docker image, and/or stop your container.
