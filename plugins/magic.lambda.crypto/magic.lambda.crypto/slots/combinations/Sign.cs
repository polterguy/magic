/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.crypto.lib.combinations;

namespace magic.lambda.crypto.slots.combinations
{
    /// <summary>
    /// [crypto.sign] slot that signs the specified content using the spcified arguments.
    /// </summary>
    [Slot(Name = "crypto.sign")]
    public class Sign : ISlot
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

            // Signing content.
            var signer = new Signer(arguments.SigningKey, arguments.SigningKeyFingerprint);
            var signed = signer.Sign(arguments.Content);

            // Returning results to caller.
            input.Value = arguments.Raw ? (object)signed : Convert.ToBase64String(signed);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Retrieves arguments for invocation.
         */
        (byte[] Content, byte[] SigningKey, byte[] SigningKeyFingerprint, bool Raw) GetArguments(Node input)
        {
            var content = Utilities.GetContent(input);
            var signingKey = Utilities.GetKeyFromArguments(input, "signing-key");
            var signingKeyFingerprint = Utilities.GetFingerprint(input);
            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;
            input.Clear();
            return (content, signingKey, signingKeyFingerprint, raw);
        }

        #endregion
    }
}
