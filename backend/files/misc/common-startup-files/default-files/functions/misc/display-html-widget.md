# Function; Display HTML widget
FUNCTION ==> display-html-widget

This function sends the specified [html] to the frontend to display it as is. Use it if the user asks you to show widget, display widget, render HTML, or something similar, and you either have some partial HTML snippet from before in your context, or the user has asked you to create HTML. It can deal with any HTML, such as HTML for rendering forms, etc.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/display-html-widget.hl]:
{
  "html": "[STRING_VALUE]",
  "filename": "[STRING_VALUE]",
  "arguments": {
    "[ARG1_NAME]": "[ARG1_VALUE]",
    "[ARG2_NAME]": "[ARG2_VALUE]"
  }
}
___
```

Arguments:

- `html` is a snippet of HTML to render on the frontend.
- `filename` is a full path to a file that'll be loaded and sent to the frontend.
- `arguments` is an optional object used to replace `[[placeholder]]` tokens in the widget HTML.

You must supply exactly one of `html` or `filename`, but not both.

**IMPORTANT** - You MUST use this function if the user asks you to show or display some HTML snippet or HTML file!

**IMPORTANT** - Remember to always use absolute URLs in your JavaScript if you're invoking the backend from HTML you have generated. You can find the backend URL further up in this instruction. The widget will be injected into an already preloaded DOM structure, so don't rely upon `DOMContentReady` or similar events. The widget must contain `WIDGET_ID_UNIQUE_NUMBER` for its JS functions, CSS selectors, etc.

If `arguments` is supplied, the HTML can contain placeholders such as `[[name]]`, `[[url]]`, or `[[image]]`. These placeholders are replaced server-side before the widget is sent to the frontend. Argument values are HTML encoded before insertion. If one or more placeholders remain unresolved, the function will fail.

Example:

```json
{
  "filename": "/modules/shop/widgets/product.html",
  "arguments": {
    "name": "Coffee Mug",
    "url": "/products/mug",
    "image": "/media/mug.jpg"
  }
}
```
