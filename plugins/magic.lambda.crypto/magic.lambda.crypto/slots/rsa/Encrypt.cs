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
    /// [crypto.rsa.encrypt] slot to encrypt some content using a public key that can only be decrypted
    /// using its public key.
    /// </summary>
    [Slot(
        Name = "crypto.rsa.encrypt",
        Description = "Encrypts data using RSA",
        ValueKind = "text,binary-content",
        ValueDescription = "Content to encrypt",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "rsa-encrypted-package,fingerprint-source",
        ReturnsDescription = "Resolves to the encrypted package as base64 text or raw bytes when [raw] is true",
        SignatureType = typeof(global::magic.lambda.crypto.signatures.RsaPublicKeySignature))]
    public class Encrypt : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving message and other arguments.
            var arguments = Utilities.GetArguments(input, false, "public-key");

            // Encrypting message.
            var encrypter = new Encrypter(arguments.Key);
            var result = encrypter.Encrypt(arguments.Message);

            // Returning results to caller according to specifications.
            input.Value = arguments.Raw ? (object)result : Convert.ToBase64String(result);
        }
    }
}
