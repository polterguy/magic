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
    [Slot(Name = "image.convert")]
    public class ImageConvert : ISlotAsync
    {
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="rootResolver">Needed to resolve absolute paths.</param>
        public ImageConvert(IRootResolver rootResolver)
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
            // Converting image.
            await Utilities.TransformImageAsync(input, _rootResolver, null);
        }
    }
}
