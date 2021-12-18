
# Temporary folder

This folder is for temporary files, and is needed for Magic to function correctly.
*Do not delete this folder* since Magic might occasionally store temporary files in it. However, do
not store anything important in this folder either, since it might be temporarily emptied.

The default docker-compose.yml file does not mount this folder as a volume, implying changes to files and
folders within this folder will _not_ be persisted as you update your magic-backend Docker image, and/or
stop your container.
