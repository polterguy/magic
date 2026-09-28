/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.signals.contracts;

namespace magic.lambda.image.slots
{
    /// <summary>
    /// [image.convert] slot for converting an existing image to another format.
    /// </summary>
    [Slot(
        Name = "image.convert",
        Description = "Re-encodes an image into a different format (e.g. PNG to JPEG) preserving its pixel content",
        ValueKind = "image-file",
        ValueDescription = "Source image filename or stream to convert",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "image",
        ReturnsDescription = "Resolves to the converted image stream unless [dest] is supplied, in which case the converted image is saved to disk and nothing is returned",
        SignatureType = typeof(global::magic.lambda.image.signatures.ImageTransformSignature))]
    public class ImageConvert : ISlotAsync
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Converting image.
            await Utilities.TransformImageAsync(input, signaler, null);
        }
    }
}
