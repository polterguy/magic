/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using MimeKit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.mime
{
    /// <summary>
    /// Parses a MimeEntity message and returns its as a hierarchical object of lambda to caller.
    /// </summary>
    [Slot(Name = ".mime.parse")]
    public class MimeParsePrivate : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var message = input.Get<MimeEntity>();
            helpers.MimeParser.Parse(input, message);
        }
    }
}
