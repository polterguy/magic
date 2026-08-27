---
title: magic.lambda.pdf
---

This project provides PDF slots for Magic. The project provides the following
slots, allowing you to convert a PDF file, stream or raw bytes to its text representation.

* __[pdf2text]__ - Converts the specified PDF file or stream to text

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

