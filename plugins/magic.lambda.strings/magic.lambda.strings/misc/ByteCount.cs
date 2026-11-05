/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
    [Slot(
        Name = "strings.byte-count",
        Description = "Returns the UTF-8 byte length of a string; useful for size checks where multi-byte characters matter",
        ValueKind = "text",
        ValueDescription = "Text to measure",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of bytes in the string")]
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
