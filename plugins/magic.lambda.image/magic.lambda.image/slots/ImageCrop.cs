/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using SkiaSharp;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.image.slots
{
    /// <summary>
    /// [image.crop] slot for cropping an existing image.
    /// </summary>
    [Slot(
        Name = "image.crop",
        Description = "Cuts margins off an image, removing the given left, top, right and bottom pixels",
        ValueKind = "image-file",
        ValueDescription = "Source image filename or stream to crop",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "image",
        ReturnsDescription = "Resolves to the cropped image stream unless [dest] is supplied, in which case the cropped image is saved to disk and nothing is returned",
        SignatureType = typeof(global::magic.lambda.image.signatures.ImageCropSignature))]
    public class ImageCrop : ISlotAsync
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Figuring out new width and height.
            var left = input.Children.FirstOrDefault(n => n.Name == "left")?.GetEx<int>() ?? 0;
            var top = input.Children.FirstOrDefault(n => n.Name == "top")?.GetEx<int>() ?? 0;
            var right = input.Children.FirstOrDefault(n => n.Name == "right")?.GetEx<int>() ?? 0;
            var bottom = input.Children.FirstOrDefault(n => n.Name == "bottom")?.GetEx<int>() ?? 0;

            // Resizing image.
            await Utilities.TransformImageAsync(input, signaler, (img) =>
            {
                /*
                 * Margins can only remove pixels, since a negative one would make the result larger than
                 * the source, and its size would be chosen by the caller.
                 */
                if (left < 0 || top < 0 || right < 0 || bottom < 0)
                    throw new HyperlambdaException("[left], [top], [right] and [bottom] cannot be negative");

                // Notice, summing as long, since two large margins would wrap around to a negative int.
                if ((long)left + right >= img.Width)
                    throw new HyperlambdaException("[left] + [right] is larger than image width");
                if ((long)top + bottom >= img.Height)
                    throw new HyperlambdaException("[top] + [bottom] is larger than image height");
                var result = new SKBitmap(img.Width - left - right, img.Height - top - bottom, img.ColorType, img.AlphaType);
                using (var canvas = new SKCanvas(result))
                {
                    canvas.DrawBitmap(img, -left, -top);
                }
                return result;
            });
        }
    }
}
