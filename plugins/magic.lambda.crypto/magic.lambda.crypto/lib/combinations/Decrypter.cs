/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using lib_rsa = magic.lambda.crypto.lib.rsa;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.lib.combinations
{
    /// <summary>
    /// Helper class allowing you to combine AES and RSA cryptography, decrypting
    /// a previously encrypted message, that was encrypted using the Encrypter equivalent.
    /// </summary>
    public class Decrypter : Util.DecrypterBase
    {
        readonly byte[] _rsaPrivateKey;

        /// <summary>
        /// Creates a new instance, allowing you to decrypt messages, using the
        /// specified private RSA key.
        /// </summary>
        /// <param name="rsaPrivateKey">Private RSA key to use for decryption</param>
        public Decrypter(byte[] rsaPrivateKey)
        {
            _rsaPrivateKey = rsaPrivateKey;
        }

        #region [ -- Implementation of abstract base class -- ]

        /// <inheritdoc />
        protected override byte[] DecryptImplementation(byte[] message)
        {
            // Creating decryption stream.
            using (var encStream = new MemoryStream(message))
            {
                // Simplifying life.
                using (var encReader = new BinaryReader(encStream))
                {
                    // Discarding encryption key's fingerprint.
                    encReader.ReadBytes(32);

                    // Reading encrypted AES key.
                    var encryptedAesKey = encReader.ReadBytes(encReader.ReadInt32());

                    // Decrypting AES key.
                    var rsaDecrypter = new lib_rsa.Decrypter(_rsaPrivateKey);
                    var decryptedAesKey = rsaDecrypter.Decrypt(encryptedAesKey);

                    // Reading the encrypted content.
                    var encryptedContent = Util.Utilities.ReadRestOfStream(encStream);

                    // Decrypting content.
                    var aesDecrypter = new aes.Decrypter(decryptedAesKey);
                    var decryptedContent = aesDecrypter.Decrypt(encryptedContent);
                    return decryptedContent;
                }
            }
        }

        #endregion
    }
}
