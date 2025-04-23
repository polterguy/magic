/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.slots.misc
{
    /// <summary>
    /// [crypto.fingerprint] slot that returns the fingerprint of whatever it is given.
    /// </summary>
    [Slot(Name = "crypto.fingerprint")]
    public class Fingerprint : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving arguments.
            var content = Utilities.GetContent(input, true);

            // Retrieving fingerprint.
            input.Value = Util.Utilities.CreateSha256Fingerprint(content);
        }
    }
}
