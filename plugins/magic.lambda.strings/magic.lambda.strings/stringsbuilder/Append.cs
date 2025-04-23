/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.builder
{
    /// <summary>
    /// [strings.builder.append] slot that performs the appending onto the StringBuilder of its specified string argument.
    /// </summary>
    [Slot(Name = "strings.builder.append")]
    public class Append : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler.Peek<StringBuilder>(".strings.builder").Append(input.GetEx<string>());
            input.Clear();
            input.Value = null;
        }
    }
}
