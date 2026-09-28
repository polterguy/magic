/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using SixLabors.ImageSharp;
using System.IO;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.image.slots
{
    /// <summary>
    /// [image.size] slot for returning the width and height of an existing image.
    /// </summary>
    [Slot(
        Name = "image.size",
        Description = "Returns the width and height of an image",
        ValueKind = "image-file",
        ValueDescription = "Image filename to inspect",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "image-dimensions,lambda-tree",
        ReturnsDescription = "Returns [width:int] and [height:int] child nodes for the image dimensions")]
    public class ImageSize : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            /*
             * Opening the file through its slot rather than the file service, and deliberately
             * WITHOUT exempting it from the whitelist, since the path came from the caller.
             */
            var file = new Node("", input.GetEx<string>());
            signaler.Signal("io.stream.open-file", file);
            using (var stream = (Stream)file.Value)
            {
                var image = Image.Identify(stream);
                input.Add(new Node("width", image.Width));
                input.Add(new Node("height", image.Height));
            }
            input.Value = null;
        }
    }
}
