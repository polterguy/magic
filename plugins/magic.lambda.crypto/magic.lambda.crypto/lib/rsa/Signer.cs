/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Security;

namespace magic.lambda.crypto.lib.rsa
{
    /// <summary>
    /// Helper class to cryptographically sign a message using RSA
    /// </summary>
    public class Signer
    {
        readonly AsymmetricKeyParameter _privateRsaKey;

        /// <summary>
        /// Private RSA key used for signing operations
        /// </summary>
        /// <param name="privateRsaKey">RSA key to use for signing operations</param>
        public Signer(byte[] privateRsaKey)
        {
            _privateRsaKey = PrivateKeyFactory.CreateKey(privateRsaKey);
        }

        /// <summary>
        /// Cryptographically signs the specified message
        /// </summary>
        /// <param name="message">Message you want to sign</param>
        /// <returns>Signature resulting from signing operation</returns>
        public byte[] Sign(byte[] message)
        {
            var signer = SignerUtilities.GetSigner($"SHA256withRSA");
            signer.Init(true, _privateRsaKey);
            signer.BlockUpdate(message, 0, message.Length);
            return signer.GenerateSignature();
        }
    }
}
