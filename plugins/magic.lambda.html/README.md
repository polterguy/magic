---
title: magic.lambda.html
---

This project provides HTML helper slots for Magic. More specifically, it provides the following slots.

* __[html2lambda]__ - Creates a lambda object out of an HTML input string.
* __[lambda2html]__ - Creates an HTML string out of the specified lambda object.
* __[markdown2html]__ - Creates HTML out of the specified Markdown input string.
* __[html2markdown]__ - Creates Markdown out of the specified HTML input string.

## How to use [html2lambda]

```
.html:@"<html>
  <head>
    <title>Howdy</title>
  </head>
  <body>
    <p class=""foo"">Howdy <strong>world</strong> - This is cool!</p>
  </body>
</html>"

html2lambda:x:-
```

The above results in something resembling the following.

```
html2lambda
   html
      head
         title
            #text:Howdy
      body
         p
            @class:foo
            #text:"Howdy "
            strong
               #text:world
            #text:" - This is cool!"
```

Attributes starts out with the `@` character, children nodes does not - While text content inside of elements will
have the name of `#text`. This implies you'll need to use escaped expression iterators when traversing the resulting node
lambda object. For instance, to retrieve the above `title` element's inner text, you could use something such as the
following.

```
get-value:x:-/**/title/*\#text
```

## How to use [lambda2html]

This is the reverse of **[html2lambda]** and returns HTML resulting from the specified lambda object. Below
is example usage.

```
.html:@"<html>
  <head>
    <title>Howdy</title>
  </head>
  <body>
    <p class=""foo"">Howdy <strong>world</strong> - This is cool!</p>
  </body>
</html>"
html2lambda:x:-
lambda2html:x:-/*
```

The above will result in the following HTML, formatted for brevity.

```html
<html>
  <head>
    <title>Howdy</title>
  </head>
  <body>
    <p class="foo">Howdy <strong>world</strong> - This is cool!</p>
  </body>
</html>
```

## How to use [markdown2html]

This library can also handle Markdown, since Markdown is arguably just another representation of HTML.
The **[markdown2html]** slot converts the specified Markdown content to HTML. Basic usage is as follows.

```
.yaml:@"
Howdy world

* Foo
* Bar
"
markdown2html:x:@.yaml
```

The above will produce the following result.

```html
markdown2html:@"<p>Howdy world</p>
<ul>
<li>Foo</li>
<li>Bar</li>
</ul>
```

## How to use [html2markdown]

```
.html:@"<html>
  <head>
    <title>Howdy</title>
  </head>
  <body>
    <h1>Header here</h1>
    <p class=""foo"">Howdy <strong>world</strong> - This is cool!</p>
  </body>
</html>"

html2markdown:x:-
```

The above results in something resembling the following.

```
# Header here

Howdy **world** - This is cool!
```

This slot will do its best to convert the specified HTML to Markdown. The process isn't perfect, since it is
impossible to consistently turn HTML into Markdown, but it is very strong in comparison to other similar libraries
out there.

You can optionally supply a **[url]** argument, which will be used to resolve relative URLs in your HTML.
The process will also return meta information, such as title, description, etc, in addition to all URLs it finds
in the document as a list of URLs in **[urls]**.

You can also optionally supply the following arguments, which all defaults to boolean true.

* **[images]** - If true imports images
* **[code]** - If true imports code
* **[lists]** - If true imports lists

### Front matter and [markdown2html]

The **[markdown2html]** slot can also handle _"front matter"_, which allows you to inject YAML at the front
of your Markdown. Front matter again is just a YAML declaration injected at the front of your Markdown,
separated by `---` to separate your YAML from your Markdown. This allows you to add structured data to
associate with your Markdown content.

```
.yaml:@"---
foo: bar
---
Howdy world

* Foo
* Bar
"
markdown2html:x:@.yaml
```

Internally, the library will invoke **[yaml2lambda]** for any front matter declarations to actually parse
the specified YAML front matter parts, implying for details about how this part works, please refer to
the _"magic.lambda.json"_ project.

