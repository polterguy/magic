/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Bc = BCrypt.Net;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto.slots.hash
{
    /// <summary>
    /// [crypto.password.verify] slot to verify a previously hashed password that was hashed with
    /// e.g. [crypto.password.hash].
    /// 
    /// Pass in the hashed version of the password as a [hash] argument, and the password itself
    /// as the value of the invocation node. Wil return true only if the password is a match to
    /// its hashed version.
    /// </summary>
    [Slot(Name = "crypto.password.verify")]
    public class VerifyPassword : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var hash = input.Children.FirstOrDefault(x => x.Name == "hash")?.GetEx<string>();
            if (hash == null)
                throw new HyperlambdaException($"No [hash] value provided to [crypto.password.verify]");

            var value = input.GetEx<string>();

            input.Value = Bc.BCrypt.Verify(value, hash);

            // House cleaning.
            input.Clear();
        }
    }
}
