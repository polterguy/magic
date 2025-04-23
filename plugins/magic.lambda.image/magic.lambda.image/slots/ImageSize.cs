/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using SixLabors.ImageSharp;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.image.slots
{
    /// <summary>
    /// [image.size] slot for returning the width and height of an existing image.
    /// </summary>
    [Slot(Name = "image.size")]
    public class ImageSize : ISlot
    {
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="rootResolver">Needed to resolve absolute paths.</param>
        public ImageSize(IRootResolver rootResolver)
        {
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var filename = input.GetEx<string>();
            var image = Image.Identify(_rootResolver.AbsolutePath(filename));
            input.Add(new Node("width", image.Width));
            input.Add(new Node("height", image.Height));
            input.Value = null;
        }
    }
}
