/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.slots.misc
{
    /// <summary>
    /// [crypto.get-key] slot that returns the fingerprint of the encryption key
    /// that was used to encrypt a message.
    /// </summary>
    [Slot(
        Name = "crypto.get-key",
        Description = "Returns or derives a cryptographic key",
        ValueKind = "crypto-encrypted-package",
        ValueDescription = "Encrypted package to extract the key fingerprint from",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "crypto-key-fingerprint",
        ReturnsDescription = "Resolves to the package key fingerprint as text or raw bytes when [raw] is true",
        SignatureType = typeof(global::magic.lambda.crypto.signatures.GetKeySignature))]
    public class GetKey : ISlot
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
            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;

            // Retrieving fingerprint.
            var fingerprint = Util.Utilities.GetPackageFingerprint(content);

            // Returning results to caller.
            if (raw)
                input.Value = fingerprint;
            else
                input.Value = Util.Utilities.CreateFingerprint(fingerprint);
        }
    }
}
