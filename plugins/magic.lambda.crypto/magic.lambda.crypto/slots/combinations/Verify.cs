/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.crypto.lib.combinations;

namespace magic.lambda.crypto.slots.combinations
{
    /// <summary>
    /// [crypto.verify] slot that verifies the package was cryptographically
    /// using the specified [public-key].
    /// </summary>
    [Slot(Name = "crypto.verify")]
    public class Verify : ISlot
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

            // Verifying content, which implies splitting the content, signature, and signing key.
            var verifier = new Verifier(arguments.PublicKey);
            var result = verifier.Verify(arguments.Content);

            // Returning result to caller.
            if (arguments.Raw)
                input.Value = result;
            else
                input.Value = Encoding.UTF8.GetString(result);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Retrieves arguments for invocation.
         */
        (byte[] Content, byte[] PublicKey, bool Raw) GetArguments(Node input)
        {
            var content = Utilities.GetContent(input, true);
            var publicKey = Utilities.GetKeyFromArguments(input, "public-key");
            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;
            input.Clear();
            return (content, publicKey, raw);
        }

        #endregion
    }
}
