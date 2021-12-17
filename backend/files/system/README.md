
# Your system module

These files are crucial for Magic to function correctly. If you choose to tamper with these files, you should
understand what you're doing, since some of these files are crucial for Magic to function correctly. 

The default docker-compose.yml file does NOT mount this folder as a volume, implying changes to files and folders within
this folder will _not_ be persisted as you update your magic-backend Docker image, and/or stop your container.
