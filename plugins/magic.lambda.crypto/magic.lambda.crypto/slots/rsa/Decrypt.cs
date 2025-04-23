/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using magic.node;
using magic.signals.contracts;
using magic.lambda.crypto.lib.rsa;

namespace magic.lambda.crypto.slots.rsa
{
    /// <summary>
    /// [crypto.rsa.decrypt] slot to decrypt some content using a private key that was previously
    /// encrypted using a public key.
    /// </summary>
    [Slot(Name = "crypto.rsa.decrypt")]
    public class Decrypt : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving message and other arguments.
            var arguments = Utilities.GetArguments(input, true, "private-key");

            // Decrypting message.
            var decrypter = new Decrypter(arguments.Key);
            var result = decrypter.Decrypt(arguments.Message);

            // Returning results to caller according to specifications.
            input.Value = arguments.Raw ? (object)result : Encoding.UTF8.GetString(result);
        }
    }
}
