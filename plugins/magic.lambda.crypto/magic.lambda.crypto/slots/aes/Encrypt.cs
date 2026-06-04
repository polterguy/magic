/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.signals.contracts;
using magic.lambda.crypto.lib.aes;

namespace magic.lambda.crypto.slots.aes
{
    /// <summary>
    /// [crypto.aes.encrypt] slot to encrypt some content using a symmetric cryptography algorithm (AES).
    /// </summary>
    // Input kind is 'text' (primary) + 'binary-content': you encrypt text payloads (secrets, tokens,
    // message bodies) or raw byte[]. The old 'content' supertype was removed — it was crypto-only, so
    // every crypto producer (decrypt/verify) and consumer (encrypt/sign/hash) advertised it and chained
    // into each other endlessly. 'text'/'binary-content' are shared broadly, which is both correct and
    // breaks the closed clique.
    [Slot(
        Name = "crypto.aes.encrypt",
        Description = "Encrypts data using AES",
        ValueKind = "text,binary-content",
        ValueDescription = "Content to encrypt",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "aes-encrypted-package,fingerprint-source",
        ReturnsDescription = "Resolves to the encrypted package as base64 text or raw bytes when [raw] is true",
        SignatureType = typeof(global::magic.lambda.crypto.signatures.AesSignature))]
    public class Encrypt : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving arguments.
            var arguments = Utilities.GetArguments(input, false);

            // Performing actual encryption.
            var encrypter = new Encrypter(arguments.Password);
            var result = encrypter.Encrypt(arguments.Message);

            // Returning results to caller according to specifications.
            input.Value = arguments.Raw ? (object)result : Convert.ToBase64String(result);
        }
    }
}
