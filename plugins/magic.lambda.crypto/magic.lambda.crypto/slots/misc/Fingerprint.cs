/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.slots.misc
{
    /// <summary>
    /// [crypto.fingerprint] slot that returns the fingerprint of whatever it is given.
    /// </summary>
    [Slot(
        Name = "crypto.fingerprint",
        Description = "Returns a SHA256 fingerprint of the input, formatted as colon-separated hex; useful for identifying public keys",
        ValueKind = "fingerprint-source",
        ValueDescription = "Base64 encoded content or raw byte[] content to fingerprint",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "fingerprint,text",
        ReturnsDescription = "Resolves to the SHA256 hash of the supplied content formatted as a fingerprint")]
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
