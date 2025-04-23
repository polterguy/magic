/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.misc
{
    /// <summary>
    /// [strings.byte-count] slot that returns the length of its specified string argument in number of bytes.
    /// </summary>
    [Slot(Name = "strings.byte-count")]
    public class ByteCount : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = Encoding.UTF8.GetByteCount(input.GetEx<string>());
        }
    }
}
