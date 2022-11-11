
# Content files

This folder is for statically served content files and mixin files. The rules for resolving files are applied
in the following order.

1. If a file exists with the specified URL and the extension of ".html" this file is resolved.
2. If a folder exists with the specified URL, and an "index.html" file can be found within in, this file is resolved
3. If a folder exists matching the URL minus the last part, and the folder contains a "default.html" file, this fil is resolved
4. Or there is no match and the resolver return 404

Example, imagine you have the following file hierarchy;

1. /index.html
2. /about.html
3. /blog/default.html
4. /help/index.html

The following URLs will resolve to the specified files.

* / - Resolves to 1
* /about - Resolves to 2
* /blog/xyz - Resolves to 3
* /help - Resolves to 4

Notice, if you create a folder named _"about"_, and you put an _"index.html"_ file inside of it, assuming you've
got the above hierarchy, this index file will be impossible to resolve, since the above _"/about.html"_ file will
have precedence.

Notice that any _"default.html"_ files will only be used for requests towards the current folder, and default
files does not propagate downwards. Implying the following request _"/blog/foo/bar"_ will _not_ resolve to the
_"/blog/default.html"_ file above assuming you have the above folder hierarchy.

The resolver will only resolve mixin files without a period (.) in the URL. If you add a period to the filename,
the resolver will return the file as a staically served file, matching it's MIME type according to its extension.
However, even statically served files will _not_ be served if they exists inside a folder with a period (.) in
its name.
