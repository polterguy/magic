---
title: magic.lambda.pdf
---

This project provides PDF slots for Magic. The project provides the following
slots, allowing you to convert a PDF file, stream or raw bytes to its text representation.

* __[pdf2text]__ - Converts the specified PDF file or stream to text
* __[html2pdf]__ - Converts HTML into a PDF document

## How to use [pdf2text]

This slot allows you to retrieve only the text parts of a PDF document.

```
pdf2text:/foo/bar.pdf
```

Notice, the slot can also accept a stream, such as for instance supplied as an uploaded
document, and react directly on the stream, avoiding having to save the stream to a file first.
It can also accept a string as its input, at which point it assumes the string is the
relative path to a file. Finally, the slot can accept raw bytes, which it then assumes
is the raw content from a PDF document.

## How to use [html2pdf]

This slot converts the HTML markup given as its value into a PDF document, and returns the PDF as raw bytes in
its value. The value can be a constant or an expression. Any images, stylesheets and fonts the HTML references
are loaded through Hyperlambda's **[io.file.load.binary]** and **[http.get]** slots, instead of directly by the
PDF library.

This slot converts HTML into a PDF document, and sets the value of its node to the bytes of the PDF. Images and stylesheets the HTML refers to are loaded through the file and HTTP slots, and so obey the whitelist. Below is an example, saving the PDF to disc.

```
html2pdf:"<h1>Hello world</h1><p>This is a PDF document.</p>"
io.file.save.binary:/misc/hello.pdf
   .:x:@html2pdf
```
