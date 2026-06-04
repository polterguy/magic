/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.signals.contracts;
using magic.lambda.crypto.lib.rsa;

namespace magic.lambda.crypto.slots.rsa
{
    /// <summary>
    /// [crypto.rsa.sign] slot to cryptographically sign some piece of data with some
    /// private RSA key.
    /// </summary>
    [Slot(
        Name = "crypto.rsa.sign",
        Description = "Signs data using RSA",
        ValueKind = "text,binary-content",
        ValueDescription = "Content to sign",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "rsa-signature,fingerprint-source",
        ReturnsDescription = "Resolves to the signature as base64 text or raw bytes when [raw] is true",
        SignatureType = typeof(global::magic.lambda.crypto.signatures.RsaPrivateKeySignature))]
    public class Sign : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving common arguments.
            var arguments = Utilities.GetArguments(input, false, "private-key");

            // Signing message.
            var signer = new Signer(arguments.Key);
            var signature = signer.Sign(arguments.Message);
            input.Value = arguments.Raw ? (object)signature : Convert.ToBase64String(signature);
        }
    }
}
