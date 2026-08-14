# Function; Download file from the web
FUNCTION ==> download-from-web

This function allows a user to download a file from some URL and save it into some folder in his or her cloudlet.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/files/download-from-web.hl]:
{
  "url": "[STRING_VALUE]",
  "filename": "[STRING_VALUE]"
}
___
```

Arguments:

- `url` is mandatory and the URL to download.
- `filename` is the mandatory path of where the file should be saved.

Notice, you can only save downloaded files in the "/etc/" and "/modules/" folders.

Notice, if you need to save a file for download locally, you can save this file into the "/etc/tmp/" folder somewhere, for then to use the `download-file` function to create a "Download" button.
