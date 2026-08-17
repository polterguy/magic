# Function; Generate image
FUNCTION ==> generate-image

This function creates an image using OpenAI's GPT Image 2 model according to the specified [prompt], [size] and [quality], saves it on the server, and returns the `filename` it was saved as together with its `url`.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/generate-image.hl]:
{
  "prompt": "[STRING_VALUE]",
  "size": "[STRING_VALUE]",
  "quality": "[STRING_VALUE]",
  "filename": "[STRING_VALUE]"
}
___
```

### Description of arguments:

* `prompt` - Mandatory and is the prompt used to generate the image.
* `size` - Optional and will default to '1024x1024' if not specified. Legal values are '1024x1024', '1536x1024', '1024x1536' and 'auto'.
* `quality` - Optional and will default to 'auto' if not specified. Legal values are 'low', 'medium', 'high' and 'auto'.
* `filename` - Optional path of where to save the image, defaulting to a randomly named PNG file inside of '/etc/www/'. Images can only be saved inside the '/etc/' and '/modules/' folders.

The returned `url` is relative to the site root, such as `/foo.png`, and must be used exactly as it is given to you. It is only returned when the image was saved inside the publicly served '/etc/www/' folder, so if you supply a `filename` outside of that folder you will only get `filename` back.

The image is already stored on the server, so do not use the `download-from-web` function on it. If the user wants a copy on their own machine, use the `download-file` function with the returned `filename` to render a download button.
