/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.crypto.lib.rsa;

namespace magic.lambda.crypto.slots.rsa
{
    /// <summary>
    /// [crypto.rsa.verify] slot to verify that some piece of text was cryptographically
    /// signed with a specific private key.
    /// </summary>
    [Slot(Name = "crypto.rsa.verify")]
    public class Verify : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving signature, and converting if necessary
            var rawSignature = input.Children.FirstOrDefault(x => x.Name == "signature")?.GetEx<object>();
            var signature = rawSignature is string strSign ?
                Convert.FromBase64String(strSign) :
                rawSignature as byte[];

            // Retrieving common arguments.
            var arguments = Utilities.GetArguments(input, false, "public-key");
            input.Value = null;

            // Verifying signature of message.
            var verifier = new Verifier(arguments.Key);
            verifier.Verify(arguments.Message, signature);
        }
    }
}
