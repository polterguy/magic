---
title: magic.lambda.io
---

This project provides file/folder slots for Magic. More specifically, it provides the following slots.

* __[io.folder.create]__ - Creates a folder on disc for you on your server
* __[io.folder.exists]__ - Returns true if folder exists, otherwise false
* __[io.folder.delete]__ - Deletes a folder on disc on your server
* __[io.folder.list]__ - Lists all folders within another source folder
* __[io.folder.move]__ - Moves a folder to its specified destination
* __[io.folder.copy]__ - Copies a folder to its specified destination
* __[io.file.load]__ - Loads a file from disc on your server
* __[load-file]__ - Alias for **[io.file.load]**
* __[io.file.load.binary]__ - Loads a file from disc on your server as a byte array
* __[io.file.save]__ - Saves a file on disc on your server
* __[save-file]__ - Alias for **[io.file.save]**
* __[io.file.save.binary]__ - Saves a file on disc on your server but contrary to the above assumes content to save is binary
* __[io.file.patch]__ - Applies a unified diff patch to a file on disc on your server
* __[io.file.exists]__ - Returns true if file exists, otherwise false.
* __[io.file.delete]__ - Deletes a file on your server.
* __[io.file.copy]__ - Copies a file on your server.
* __[io.file.execute]__ - Executes a Hyperlambda file on your server.
* __[execute-file]__ - Alias for **[io.file.execute]** except it will forward evaluate all descendant nodes using **[unwrap]**
* __[io.file.list]__ - List files in the specified folder on your server.
* __[io.file.move]__ - Moves a file on your server.
* __[io.file.unzip]__ - Unzips a file on your server.
* __[io.stream.open-file]__ - Opens the specified filename and returns it as a stream
* __[io.stream.save-file]__ - Saves a stream to the specified destination path
* __[io.stream.read]__ - Reads all content from the specified stream as a byte array
* __[io.stream.close]__ - Closes a previously opened stream
* __[io.content.zip-stream]__ - Creates a ZipStream for you, without touching the file system
* __[.io.folder.root]__ - Returns the root folder of your system. (private C# slot)
* __[io.file.mixin]__ - Allows you to invoke lambda objects from a file and substitute content dynamically in your original file
* __[io.file.search]__ - Searches file content and returns filename + line numbers

## magic.lambda.io fundamentals

magic.lambda.io can _only_ manipulate files and folders inside of your _"files"_ folder in your web server.
These are normally files inside of the folder you have configured in your _"appsettings.json"_ file, with the
key _"magic.io.root-folder"_. This implies that all paths are _relative_ to this path, and no files or folders
from outside of this folder can in any ways be manipulated using these slots. These are the files you
can see when you open Hyper IDE.

Notice, if you wish to change this configuration value, then the character tilde "~" means root
folder where your application is running from within. There is nothing preventing you from using an
absolute path, but if you do, you must make sure your web server process have full rights to modify
files within this folder. We do not recommend changing this configuration setting.

### How to use [io.folder.create]

Creates a new folder on disc. The example below will create a folder named _"foo"_ inside of the _"misc"_ folder.
Notice, will throw an exception if the folder already exists.

```
io.folder.create:/misc/foo/
```

### How to use [io.folder.exists]

Returns true if specified folder exists on disc.

```
io.folder.exists:/misc/foo/
```

### How to use [io.folder.delete]

Deletes the specified folder on disc. Notice, will throw an exception if the folder doesn't exists.

```
io.folder.delete:/misc/foo/
```

### How to use [io.folder.list]

Lists all folders inside of the specified folder. By default hidden folders will not be shown, unless
you pass in **[display-hidden]** and set its value to boolean _"true"_.

```
io.folder.list:/misc/
```

### How to use [io.folder.move]

Moves the specified source folder to its specified destination folder.

```
io.folder.move:/misc/source-folder/
   .:/misc/destination-folder/
```

### How to use [io.folder.copy]

Copies the specified source folder to its specified destination folder. Notice, this slot doesn't copy
the folder itself, but rather the folder's content. Below is an example.

```
io.folder.copy:/misc/source-folder/
   .:/misc/destination-folder/
```

After invocation of the above, every single file and folder inside your _"source-folder"_ can now
be found as a copy inside your _"destination-folder"_.

### How to use [io.file.load]

Loads the specified text file from disc. This slot can _only load text files_. Or to be specific,
there are no ways you can change binary files, hence loading a binary file is for the most parts
not something you should do. Although there _might_ exist exceptions to this.

```
io.file.load:/misc/README.md
```

**Notice** - If you want to load binary content you should use the **[io.file.load.binary]** override.

### How to use [io.file.save]

Saves the specified content to the specified file on disc, overwriting any previous content if the
file exists from before, creating a new file if no such file already exists. The value of the first
argument will be considered the content of the file.

Notice, the node itself will be evaluated, allowing you to have other slots evaluated before slot saves
the file, to return dynamically the content of your file.

```
io.file.save:/misc/README2.md
   .:This is new content for file
```

**Notice** - If you want to save binary content you should use the **[io.file.save.binary]** override.

### How to use [io.file.patch]

Applies a unified diff patch to the specified file on disc. The patch is provided as the first child argument.
This slot evaluates its children before applying the patch, which allows you to dynamically create the patch
using other slots.

```
io.file.patch:/misc/README2.md
   .:@"
@@ -1,3 +1,4 @@
 This is line 1
 This is line 2
 This is line 3
+This is line 4
"
```

#### Patch format rules

The patch parser accepts standard unified diff format, but still enforces some rules and will throw if the patch deviates.

* The patch must target **exactly one file**.
* Each hunk must start with a header line in this format: `@@ -a,b +c,d @@`.
* Every line inside a hunk must begin with one of these characters:
  * ` ` (space) for context lines
  * `-` for deletions
  * `+` for additions
  * `\` for the `\ No newline at end of file` marker
* Empty lines inside a hunk are allowed and treated as context lines.
* Context lines must match the file content **exactly**, otherwise the patch will fail.
* Hunk line counts are not enforced, but the starting line number must match.

### How to use [io.file.exists]

Returns true if specified file exists from before.

```
io.file.exists:/misc/README.md
```

### How to use [io.file.delete]

Deletes the specified file. Will throw an exception if the file doesn't exist.

```
io.file.delete:/misc/README2.md
```

### How to use [io.file.copy]

Copies the specified file to the specified destination folder and file.
Notice, requires the destination folder to exist from before, and the source
file to exist from before. This slot will delete any previously existing destination
file, before starting the copying process. Just like the save slot, this will evaluate
the lambda children before it executes the copying of your file, allowing you to use
the results of slots as the destination path for your file.

```
io.file.copy:/misc/README.md
   .:/misc/backup/README-backup.md
```

Notice, the folder parts of the destination folder is _optional_, and if you don't supply a folder
as a part of the path, the source folder will be used by default.

### How to use [io.file.execute]

Executes the specified Hyperlambda file. Just like when evaluating a dynamic slot, you can
pass in an **[.arguments]** node to the file, which will be considered arguments to your file.
Hence, this slot allows you to invoke a file, as if it was a dynamically created slot, and there
is no semantic difference really between this slot and **[signal]** from the _magic.lambda.slots_
project.

```
io.file.execute:/misc/some-hyperlambda-file.hl
```

#### How to use [execute-file]

The **[execute-file]** slot is an alias for **[io.file.execute]**, but it will **[unwrap]** all children nodes,
automatically transform any expressions to their static value equivalents, allowing you to combine **[unwrap]**
and **[io.file.execute]** into one invocation. This makes usage slightly less verbose for cases such as the following.

```
.args
   foo1:bar1
   foo2:bar2
execute-file:/whatever-file.hl
   arg1:x:@.args/*/foo1
   arg2:x:@.args/*/foo2
```

In the above example both arguments to our _"/whatever-file.hl"_ file will be evaluated before the file is executed,
resulting in **[arg1]** and **[args2]** having the values of _"bar1"_ and _"bar2"_ respectively.

If you pass in a node named **[node_reference]** using the above syntax, this node will be especially handled, and
passed in by reference instead of evaluated as a single expression value. Consider the following alternative to
the above.

```
.args
   foo1:bar1
   foo2:bar2
execute-file:/whatever-file.hl
   node_reference:x:@.args
```

Inside your above _"/whatever-file.hl"_ file you will now have access to the entire **[.args]** node by reference.

### How to use [io.file.list]

Lists all files inside of the specified folder. By default hidden files will not be shown, unless
you pass in **[display-hidden]** and set its value to boolean _"true"_.

```
io.file.list:/misc/
```

### How to use [io.file.search]

Searches all files recursively inside the specified folder and returns filenames with line numbers
containing the specified pattern.

```
io.file.search:/modules/
   pattern:"TODO"
```

Optional arguments:

* __[regex]__ - Treats pattern as regular expression
* __[case-sensitive]__ - Enables case sensitive search
* __[extensions]__ - Comma-separated list of extensions (e.g. .cs,.hl)

Example with regex + extensions:

```
io.file.search:/modules/
   pattern:"class\\s+Git"
   regex:true
   extensions:.cs,.hl
```

Return value example:

```
io.file.search
   .
      file:/modules/foo/bar.cs
      lines
         .:12
         .:48
```

### How to use [io.file.move]

Similar to **[io.file.copy]** but deletes the source file after evaluating.

```
io.file.move:/misc/README.md
   .:/misc/backup/README-backup.md
```

### How to use [io.file.unzip]

Unzips a ZIP file. Notice, the **[folder]** argument is optional, and the current folder
of the ZIP file you're unzipping will be used if no **[folder]** argument is given.

```
io.file.unzip:/misc/foo.zip
   folder:/misc/backup/
```

Optionally provide **[overwrite]** argument and set its value to boolean true if you want the operation to
overwrite any existing files in the destination folder. Otherwise the operation will throw an exception
if any of the files exists from before.

### How to use [io.file.mixin]

This slot takes a filename as its primary argument, and optionally any amount of lambda children objects.
It allows for dynamically substituting for instance `{{*/.name}}` segments in your original source file,
by invoking lambda objects it can find by evaluating your `{{xyz}}` segment as an expression
leading to some lambda object you want to execute. Below is an example of usage that assumes you've got a
file named _"foo.html"_ at the root folder of your installation resembling the following.

**/foo.html**

```
<html>
    <head>
        <title>Hello world</title>
    </head>
    <body>
        <h1>Hello world</h1>
        <p>
           Hello there {{*/.name}}, 2 + 5 is {{*/.add}}
        </p>
    </body>
</html>
```

If you create the above file you can invoke **[io.file.mixin]** as follows to see the result.

```
io.file.mixin:/foo.html
   .name:Thomas Hansen
   .add
      math.add
         .:int:2
         .:int:5
      return:x:-
```

The above will substitute all your `{{xyz}}`segments and give you a result resembling the following.

```
<html>
    <head>
        <title>Hello world</title>
    </head>
    <body>
        <h1>Hello world</h1>
        <p>
           Hello there Thomas Hansen, 2 + 5 is 7
        </p>
    </body>
</html>
```

Notice, if the node your expression is leading to has a value such as illustrated above, it will return that value
instead of executing your node as a lambda object.

All **[.oninit]** lambda objects found as children of your **[io.file.mixin]** invocation will be executed before
any mixin logic is executed, allowing for you to create common initialisation logic, that runs once but is referenced
in multiple mixin expressions.

### How to use [io.content.zip-stream]

Creates a memory based ZIP stream you can return over the HTTP response object. Notice,
this doesn't create a zip file, but rather a zip stream, which you can manipulate using other
slots. This slot is useful if you need to return zipped content as your HTTP response for instance.

Notice, both the root arguments (lambda children) of this slot will be evaluated, in addition to
its content nodes, evaluated once for each file declaration node. Notice also that the stream is
a memory based stream, and hence closing it, even in case of an exception, is not necessary.

```
io.content.zip-stream
   .:/foo/x.txt
      .:content of file
```

### How to use [io.stream.open-file]

Works similarly to **[io.file.load]** but instead of returning the file's content,
it returns the raw stream back to caller.

```
io.stream.open-file:/foo/bar.txt
```

After invoking the above, assuming the file exists, a raw `Stream` object can be
found as the value of the **[io.stream.open-file]** node.

### How to use [io.stream.save-file]

Works similarly to **[io.file.save]** but instead of taking source content of some kind,
it assumes the source is an open `Stream` of some sort.

```
/*
 * [.stream] here is an open stream, from for instance the HTTP
 * request object, or something similar that somehow is able to open
 * a stream and pass around in Hyperlambda.
 */
.stream
io.stream.save-file:/foo/bar.txt
   get-value:x:@.stream
```

After invoking the above, assuming the **[.stream]** node contains a valid `Stream`
object, the file above will contain the content from the stream.

**Notice** - If the file exists from before the existing file will be deleted, unless you
pass in an **[overwrite]** argument and set its value to false, at which point an exception
will be thrown if the file exists from before.

### How to use [io.stream.read]

Works similarly to **[io.file.load]** but instead of taking a source filename of some kind,
it assumes the source is an open `Stream` of some sort.

```
/*
 * [.stream] here is an open stream, from for instance the HTTP
 * request object, or something similar.
 */
.stream
io.stream.read:x:@.stream
```

### How to use [io.stream.close]

Closes a previously opened stream.

**Notice** - You would rarely directly use streams from Hyperlambda, and not manipulate them
in any ways, but rather use for instance **[io.file.load]** and similar _"high level"_ slots -
And only use streams when you need to directly access the HTTP request stream, to persist a file
uploaded by a user, or return a file over the HTTP response object. Hence, directly opening
a stream for any other purpose but to return it over the HTTP response object is something you'd
probably never want to do. And if you return the stream over the HTTP response object, .Net takes
ownership over the stream, and ensures it is closed and disposed. However, for completeness we've
still provided the ability to explicitly close a stream using the **[io.stream.close]** - Even though
you would probably never really need to use it. Besides, opening streams for any other purpose but
to return them over the HTTP response object, might also create leaks, since there is no means to
guarantee that the stream is closed in case of exceptions, etc - Unless you explicitly take care
of such things manually.

```
io.stream.open-file:/foo/bar.txt
io.stream.close:x:-
```

After invoking the above, assuming the file exists, the stream previously opened
by **[io.stream.open-file]** will be explicitly closed.

### How to use [.io.folder.root]

Returns the root folder of the system. Cannot be invoked from Hyperlambda, but only from C#. Intended as
a support function for other C# slots.

```
var node = new Node();
signaler.Signal(".io.folder.root", node);

// Retrieving root folder after evaluating slot.
var rootFolder = node.Get<string>();
```
