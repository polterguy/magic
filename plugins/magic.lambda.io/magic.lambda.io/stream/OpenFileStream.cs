/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.stream
{
    /// <summary>
    /// [io.stream.open-file] slot for opening a file in read only mode
    /// and returning it as a stream to caller.
    /// </summary>
    [Slot(Name = "io.stream.open-file")]
    public class OpenFileStream : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IStreamService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Service implementation.</param>
        public OpenFileStream(IRootResolver rootResolver, IStreamService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Opening file and returning to caller.
            input.Value = await _service.OpenFileAsync(_rootResolver.AbsolutePath(input.GetEx<string>()));
        }
    }
}
