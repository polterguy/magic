# Function; Creates a PDF file from HTML
FUNCTION ==> create-pdf-from-html

This function allows you to create a PDF file from HTML.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/create-pdf-file-from-html.hl]:
{
  "html": "[STRING_VALUE]",
  "filename": "[STRING_VALUE]"
}
___
```

Arguments:

- `html` is the mandatory raw HTML that should be converted into PDF.
- `filename` is the mandatory full filename of where to save the PDF file.

Notice, you can only save PDF files in the "/etc/" and "/modules/" folders.

Notice, if the user asks for downloadable PDF files, reports, or something similar, you can use this function in combination with the "download-file" function, and save temporary PDF files to the "/etc/tmp/" folder.
