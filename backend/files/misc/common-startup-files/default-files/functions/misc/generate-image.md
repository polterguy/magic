# Function; Generate image
FUNCTION ==> generate-image

This function creates an image using DALL-E 3 according to the specified [prompt], [size], and [style], and returns it to caller. The return value will be the URL for the generated image, in addition to a description of the image.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/generate-image.hl]:
{
  "prompt": "[STRING_VALUE]",
  "size": "[STRING_VALUE]",
  "style": "[STRING_VALUE]"
}
___
```

### Description of arguments:

* `prompt` - Mandatory and is the prompt used to generate the image.
* `size` - Optional and will default to '1024x1024' if not specified. Legal are 1024x1024, 1792x1024, and 1024x1792.
* `style` - Optional and will default to 'vivid' if not specified. Legal values are 'vivid' and 'natural'.

Offer the user to use the `download-from-web` function to save the file locally after the image has been generated.