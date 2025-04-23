/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Text;
using magic.node.extensions;

namespace magic.lambda.crypto.lib.combinations
{
    /// <summary>
    /// Helper class to cryptographically sign a message, using the specified private RSA key.
    /// </summary>
    public class Signer
    {
        readonly byte[] _privateKey;
        readonly byte[] _publicKeyFingerprint;

        /// <summary>
        /// Creates a new instance of a signer, allowing you to cryptographically sign message(s)
        /// </summary>
        /// <param name="privateRsaKey">What private RSA key to use for the signing operation</param>
        /// <param name="publicKeyFingerprint">The public key's fingerprint</param>
        public Signer(byte[] privateRsaKey, byte[] publicKeyFingerprint)
        {
            // Sanity checking invocation, fingerprint should be SHA256 of signing key's public sibling.
            if (publicKeyFingerprint.Length != 32)
                throw new HyperlambdaException("Signing key's fingerprint was not valid");

            _privateKey = privateRsaKey;
            _publicKeyFingerprint = publicKeyFingerprint;
        }

        /// <summary>
        /// Cryptographically signs the specified message, using the arguments provided during
        /// creation of instance.
        /// </summary>
        /// <param name="message">Message to sign</param>
        /// <returns>Combination of fingerprint + signature and original message</returns>
        public byte[] Sign(byte[] message)
        {
            return SignImplementation(message);
        }

        /// <summary>
        /// Cryptographically signs the specified message, using the arguments provided during
        /// creation of instance.
        /// </summary>
        /// <param name="message">Message to sign</param>
        /// <returns>Combination of fingerprint + signature and original message</returns>
        public byte[] Sign(string message)
        {
            return SignImplementation(Encoding.UTF8.GetBytes(message));
        }

        /// <summary>
        /// Cryptographically signs the specified message, using the arguments provided during
        /// creation of instance.
        /// </summary>
        /// <param name="message">Message to sign</param>
        /// <returns>Combination of fingerprint + signature and original message in base64 encoded format</returns>
        public string SignToString(byte[] message)
        {
            return Convert.ToBase64String(SignImplementation(message));
        }

        /// <summary>
        /// Cryptographically signs the specified message, using the arguments provided during
        /// creation of instance.
        /// </summary>
        /// <param name="message">Message to sign</param>
        /// <returns>Combination of fingerprint + signature and original message in base64 encoded format</returns>
        public string SignToString(string message)
        {
            return Convert.ToBase64String(SignImplementation(Encoding.UTF8.GetBytes(message)));
        }

        #region [ -- Private helper methods -- ]

        byte[] SignImplementation(byte[] message)
        {
            // Creating plain text stream.
            using (var stream = new MemoryStream())
            {
                // Simplifying life.
                using (var writer = new BinaryWriter(stream))
                {
                    // Writing SHA256 of fingerprint key.
                    writer.Write(_publicKeyFingerprint);

                    // Writing signature.
                    var signer = new rsa.Signer(_privateKey);
                    var signature =  signer.Sign(message);
                    writer.Write(signature.Length);
                    writer.Write(signature);

                    // Writing content.
                    writer.Write(message);
                    return stream.ToArray();
                }
            }
        }

        #endregion
    }
}
