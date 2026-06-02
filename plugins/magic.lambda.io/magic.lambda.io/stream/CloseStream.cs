/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.stream
{
    /// <summary>
    /// [io.stream.close] slot for closing a previously opened stream.
    /// </summary>
    [Slot(
        Name = "io.stream.close",
        Description = "Closes and disposes a stream previously opened by [io.stream.open-file] or similar; always call to release the file handle",
        ValueKind = "stream",
        ValueDescription = "Stream instance to close",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.None)]
    public class CloseStream : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var stream = input.GetEx<Stream>();
            stream.Close();
            stream.Dispose();
        }
    }
}
