/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.crypto.lib.combinations;

namespace magic.lambda.crypto.slots.combinations
{
    /// <summary>
    /// [crypto.decrypt] slot that decrypts and verifies the
    /// specified content using the specified arguments.
    /// 
    /// This slots assumes the message was encrypted using its [crypto.encrypt] equivalent.
    /// </summary>
    [Slot(Name = "crypto.decrypt")]
    public class Decrypt : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving arguments.
            var arguments = GetArguments(input);

            // Decrypting content.
            var decrypter = new Decrypter(arguments.DecryptionKey);
            var result = decrypter.Decrypt(arguments.Content);

            // Verifying content, but only if caller supplied a [verify-key].
            if (arguments.VerifyKey != null && arguments.VerifyKey.Length > 0)
            {
                // Caller passed in a public key to verify the signature of message.
                var verifier = new Verifier(arguments.VerifyKey);
                result = verifier.Verify(result);

                // Returning result to caller.
                if (arguments.Raw)
                    input.Value = result;
                else
                    input.Value = Encoding.UTF8.GetString(result);
            }
            else
            {
                // Returning result to caller.
                // Notice, package is still "raw" since signature hasn't been verified yet.
                if (arguments.Raw)
                    input.Value = result;
                else
                    input.Value = Convert.ToBase64String(result);
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Retrieves arguments for invocation.
         */
        (byte[] Content, byte[] DecryptionKey, byte[] VerifyKey, bool Raw) GetArguments(Node input)
        {
            var content = Utilities.GetContent(input, true);
            var decryptionKey = Utilities.GetKeyFromArguments(input, "decryption-key");
            var verifyKey = Utilities.GetKeyFromArguments(input, "verify-key", false);
            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;
            input.Clear();
            return (content, decryptionKey, verifyKey, raw);
        }

        #endregion
    }
}
