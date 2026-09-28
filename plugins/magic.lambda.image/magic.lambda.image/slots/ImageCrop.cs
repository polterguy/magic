/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
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
        Description = "Cuts a rectangular region out of an image at the given x, y, width, and height",
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
                if (left + right >= img.Width)
                    throw new HyperlambdaException("[left] + [right] is larger than image width");
                if (top + bottom >= img.Height)
                    throw new HyperlambdaException("[top] + [bottom] is larger than image height");
                img.Mutate(n => n.Crop(new Rectangle(left, top, img.Width - left - right, img.Height - top - bottom)));
                return Task.CompletedTask;
            });
        }
    }
}
