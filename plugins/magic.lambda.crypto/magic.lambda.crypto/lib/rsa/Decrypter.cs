/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Security;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Encodings;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.lib.rsa
{
    /// <summary>
    /// Helper class to decrypt a message using RSA encryption.
    /// </summary>
    public class Decrypter : Util.DecrypterBase
    {
        readonly AsymmetricKeyParameter _privateRsaKey;

        /// <summary>
        /// Creates a new instance of the class.
        /// </summary>
        /// <param name="privateRsaKey">Private RSA key used to decrypt the message(s)</param>
        public Decrypter(byte[] privateRsaKey)
        {
            _privateRsaKey = PrivateKeyFactory.CreateKey(privateRsaKey);
        }

        /// <inheritdoc />
        protected override byte[] DecryptImplementation(byte[] message)
        {
            // Creating our encryption engine, and decorating according to caller's specifications.
            var encryptEngine = new Pkcs1Encoding(new RsaEngine());
            encryptEngine.Init(false, _privateRsaKey);

            // Decrypting message, and returning results to according to caller's specifications.
            var result = encryptEngine.ProcessBlock(message, 0, message.Length);
            return result;
        }
    }
}
