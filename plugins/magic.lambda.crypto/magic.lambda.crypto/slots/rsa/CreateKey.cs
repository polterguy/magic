/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.crypto.lib.rsa;

namespace magic.lambda.crypto.slots.rsa
{
    /// <summary>
    /// [crypto.rsa.create-key] slot to create an RSA keypair and return as DER encoded,
    /// .
    /// </summary>
    [Slot(Name = "crypto.rsa.create-key")]
    public class CreateKey : ISlot
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

            // Generating key pair.
            var generator = new KeyGenerator(arguments.Seed);
            var result = generator.Generate(arguments.Strength);
            if (arguments.Raw)
            {
                // Returning as DER encoded raw byte[].
                input.Add(new Node("private", result.PrivateKey));
                input.Add(new Node("public", result.PublicKey));
            }
            else
            {
                // Returning as base64 encoded DER format.
                input.Add(new Node("private", Convert.ToBase64String(result.PrivateKey)));
                input.Add(new Node("public", Convert.ToBase64String(result.PublicKey)));
            }
            input.Add(new Node("fingerprint", result.Fingerprint));
            input.Add(new Node("fingerprint-raw", result.FingerprintRaw));
        }

        #region [ -- Private helper methods -- ]

        (int Strength, byte[] Seed, bool Raw) GetArguments(Node input)
        {
            var strength = input.Children.FirstOrDefault(x => x.Name == "strength")?.GetEx<int>() ?? 2048;

            var rawSeed = input.Children.FirstOrDefault(x => x.Name == "seed")?.GetEx<object>();
            var seed = rawSeed is string strSeed ?
                Encoding.UTF8.GetBytes(strSeed) :
                rawSeed as byte[];

            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;

            input.Clear();
            return (strength, seed, raw);
        }

        #endregion
    }
}
