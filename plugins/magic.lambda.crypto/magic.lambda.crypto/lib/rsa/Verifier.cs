/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node.extensions;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Security;

namespace magic.lambda.crypto.lib.rsa
{
    /*
     * 
     */
    /// <summary>
    /// Helper class to verify a message cryptographically signed with some RSA key.
    /// </summary>
    public class Verifier
    {
        readonly AsymmetricKeyParameter _key;
        
        /// <summary>
        /// Creates a new instance of your type
        /// </summary>
        /// <param name="publicKey">Public key to verify signature with</param>
        public Verifier(byte[] publicKey)
        {
            _key = PublicKeyFactory.CreateKey(publicKey);
        }

        /// <summary>
        /// Verifies a signature towards a public key.
        /// </summary>
        /// <param name="message">Message to verify</param>
        /// <param name="signature">Signature that was generated from message</param>
        public void Verify(byte[] message, byte[] signature)
        {
            // Creating our signer and associating it with the private key.
            var signer = SignerUtilities.GetSigner($"SHA256withRSA");
            signer.Init(false, _key);

            // Signing the specified data, and returning to caller as base64.
            signer.BlockUpdate(message, 0, message.Length);
            if (!signer.VerifySignature(signature))
                throw new HyperlambdaException("Signature mismatch");
        }
    }
}
