
# Your dynamic files folder

This folder contains your dynamic files. These are the files that can be resolved using Hyperlambda,
and in a way becomes the _"root folder"_ for Hyperlambda. All dynamically server Hyperlambda endpoints
can be found within this folder.

Notice, some sub folders inside of this folder is automatically taken care of by Magic, and updating
Magic might invalidate any changes to these folders - While other folders here are mounted as _"volumes"_
if you deploy Magic using Docker, implying changes are persisted in these folders also as you update Magic.
Due to this, you should only store your own files into one of these two sub folders.

* `modules` - Contains Hyperlambda code for modules
* `etc` - Contains data or dynamic files specific for modules
