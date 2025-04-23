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
    [Slot(Name = "crypto.aes.encrypt")]
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
