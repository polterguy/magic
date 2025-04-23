/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using SixLabors.ImageSharp.Processing;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.image.slots
{
    /// <summary>
    /// [image.resize] slot for resizing an existing image.
    /// </summary>
    [Slot(Name = "image.resize")]
    public class ImageResize : ISlotAsync
    {
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="rootResolver">Needed to resolve absolute paths.</param>
        public ImageResize(IRootResolver rootResolver)
        {
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Figuring out new width and height.
            var widthNode = input.Children.FirstOrDefault(x => x.Name == "width");
            var heightNode = input.Children.FirstOrDefault(x => x.Name == "height");
            if (widthNode == null && heightNode == null)
                throw new HyperlambdaException("You have to provide either [width], [height] or both to [image.resize]");
            var width = widthNode?.GetEx<int>() ?? 0;
            var height = heightNode?.GetEx<int>() ?? 0;

            // Resizing image.
            await Utilities.TransformImageAsync(input, _rootResolver, (img) => 
            {
                img.Mutate(x => x.Resize(width, height));
                return Task.CompletedTask;
            });
        }
    }
}
