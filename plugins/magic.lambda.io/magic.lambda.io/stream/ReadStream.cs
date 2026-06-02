/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.stream
{
    /// <summary>
    /// [io.stream.read] slot for reading everything from a stream as
    /// raw byte[] content and returning to caller.
    /// </summary>
    [Slot(
        Name = "io.stream.read",
        Description = "Reads from an open stream",
        ValueKind = "stream",
        ValueDescription = "Stream instance to read from",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "binary-content,fingerprint-source",
        ReturnsDescription = "Resolves to the bytes read from the stream")]
    public class ReadStream : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var stream = input.GetEx<Stream>();
            var memory = new MemoryStream();
            await stream.CopyToAsync(memory);
            input.Value = memory.ToArray();
        }
    }
}
