
# Content files

This folder is for statically served content files and mixin files. A mixin file is created by combining
an HTML file with a Hyperlambda codebehind file, using the **[mixin]** slot. See the magic.lambda project's
documentation to understand how mixins works. The rules for resolving files are applied in the following order.

1. If a file exists with the specified URL and the extension of ".html" this file is resolved. For instance, "/about" is resolved to "/about.html".
2. If a folder exists with the specified URL, and an "index.html" file can be found within in, this file is resolved. For instance "/features" is resolved to "/features/index.html"
3. If a folder exists matching the URL minus the last part, and the folder contains a "default.html" file, this file is resolved. For instance, "/blog/xyz" resolves to "/blog/default.html" allowing you to render dynamic content with dyncami URLs, becoming "wildcard" handlers within one folder.

If none of the above rules resolves to an actual file, the resolver returns a 404 Not Found response.

Example, imagine you have the following file hierarchy;

1. /index.html
2. /about.html
3. /blog/default.html
4. /features/index.html

The following URLs will resolve to the specified files.

* / - Resolves to "/index.html"
* /about - Resolves to "/about.html"
* /blog/xyz - Resolves to "/blog/default.html" (wildcard resolver)
* /features - Resolves to "/features/index.html"

Notice, if you create a folder named _"about"_, and you put an _"index.html"_ file inside of it, assuming you've
got the above hierarchy, this file will be impossible to resolve, since the above _"/about.html"_ file will
have precedence. Rules are applied in the order specified above, and if one rule is a match for a file, that file
is returned without trying the rest of the rules.

Notice that any _"default.html"_ files will only be used for requests towards the current folder, and default
files does not propagate downwards. Implying the following request _"/blog/foo/bar"_ will _not_ resolve to the
_"/blog/default.html"_ file above assuming you have the above folder hierarchy.

The resolver will only resolve mixin files without a period (.) in the URL. If you add a period to the filename,
the resolver will return the file as a staically served file, matching it's MIME type according to its extension.
However, even statically served files will _not_ be served if they exists inside a folder with a period (.) in
its name. You can _only_ have periods in the filenames of files, and not in the folder from where they are resolved.
This allows you to create _"private"_ folders where you store _"reusable component"_ types of files.

Internally the resolver simply uses the **[mixin]** slot to combine HTML files with Hyperlambda codebehind
files. Implying you can inject component files from your Hyperlambda codebehind, to recursively build your
HTML, something illustrated in the _"/recursive"_ folder where it is injecting another HTML mixin file from
its codebehind lambda object.

To see how static files are resolved, you can try to access _"/README.md"_ to see this file itself through your
browser.
