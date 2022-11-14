
# Content files

This folder is for statically and dynamically served content files. A dynamically rendered file is created by combining
an HTML file with a Hyperlambda codebehind file, using the **[io.file.mixin]** slot. See the _"magic.lambda.io"_ project's
documentation to understand how such mixin invocations works. The rules for resolving files are applied in the following order.

1. If the URL directly maps to an HTML file, this file is resolved.
2. If a file exists with the specified URL + _".html"_ this file is resolved. For instance, _"/about"_ is resolved to _"/about.html"_.
3. If a folder exists with the specified URL and the URL ends with _"/"_, and an _"index.html"_ file can be found within the folder, this file is resolved. For instance _"/features/"_ is resolved to _"/features/index.html"_.
4. If a _"default.html"_ file exists either directly within the folder the request is requesting files from, or upwards in the folder hierarchy, this file is resolved. For instance, _"/blog/xyz"_ resolves to _"/blog/default.html"_ allowing you to render dynamic content with dynamic URLs, becoming _"wildcard"_ handlers. If you don't have a _"/blog/default.html"_ file, but you do have a _"/default.html"_ file, this file will be resolved. This allows you to apply wildcard handlers for entire folder hierarchies.

If none of the above rules resolves to an actual file, the resolver returns a 404 Not Found response.
Imagine you have the following file hierarchy;

1. _"/index.html"_
2. _"/about.html"_
3. _"/blog/default.html"_
4. _"/features/index.html"_

The following URLs will resolve to the specified files.

* _"/"_ - Resolves to _"/index.html"_
* _"/about"_ - Resolves to _"/about.html"_
* _"/blog/xyz"_ - Resolves to _"/blog/default.html"_ (wildcard resolver)
* _"/features/"_ - Resolves to _"/features/index.html"_

Rules are applied in the order specified above, and if one rule is a match for a file, that file
is returned without trying the rest of the rules.

Notice that _"default.html"_ files propagates upwards in the hierarchy, implying a request trowards _"/x/y/z/q"_
will be handled by the first of the following files the resolver can find.

1. _"/x/y/z/default.html"_
2. _"/x/y/default.html"_
3. _"/x/default.html"_
4. _"/default.html"_

The resolver will not resolve to hidden files or folders, implying files and folders starting with a _"."_.
If you add a file extention to your request, and your extention is not _".html"_, the resolver will try to resolve your
request as a static file request, and returning the file as a static resource. The MIME type a statically rendered file
is served with depends upon its file extention, and can be seen using **[mime.list]**. By not serving hidden files in
folders starting with a _"."_, you can create _"private"_ folders where you store _"reusable component"_ types of files.

Internally the resolver simply uses the **[io.file.mixin]** slot to combine HTML files with Hyperlambda codebehind
files. You can also inject component files from your Hyperlambda codebehind using your own **[io.file.mixin]** invocations,
to recursively build your HTML. Below is an example of an HTML file that dynamically substitutes parts of its HTML
by invoking Hyperlambda lambda objects from its codebehind file.

**/index.html**

```
<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    Hello from {{*/.hello}}
  </body>
</html>
```

**/index.hl**

```
.hello:The Machine
```

The library also supports interceptors similarly to how the default API rendering logic allows for using interceptors.
If you have an interveptor resembling the following.

```
data.connect:magic
   .interceptor
   return:x:-
```

And a _"/index.hl"_ file resembling the following.

```
.count
   data.scalar:select count(*) from log_entries
   return:x:-
```

And an _"/index.html"_ HTML file resembling the following.

```html
<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    Count of log items {{*/.count}}
  </body>
</html>
```

The the above invocation to `{{*/.count}}` will return count from your _"log-entries"_ database table
and substitute the `{{*/.count}}` parts, and your combined Hyperlambda file that's used to resolve
the URL of _"/"_ or _"/index.html"_ will become as follows.

```
data.connect:magic
   io.file.mixin:/etc/www/index.html
   .count
      data.select:select count(*) from log_entries
      return:x:-
   return:x:-
```
