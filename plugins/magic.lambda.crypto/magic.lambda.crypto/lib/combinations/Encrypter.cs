/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using Org.BouncyCastle.Security;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.lib.combinations
{
    /// <summary>
    /// Encrypter helper class, allowing you to combine RSA and AES cryptography, to create an
    /// encrypted package.
    /// </summary>
    public class Encrypter : Util.EncrypterBase
    {
        readonly byte[] _encryptionKey;
        readonly SecureRandom _csrng;

        /// <summary>
        /// Creates a new instance with the specified seed and encryption key.
        /// </summary>
        /// <param name="encryptionKey">Public RSA key to use for encryption operation(s)</param>
        /// <param name="seed">Seed to use for the CSRNG used to generate a random AES key</param>
        public Encrypter(byte[] encryptionKey, byte[] seed = null)
        {
            // Creating our CS RNG instance.
            _csrng = new SecureRandom();
            if (seed != null)
                _csrng.SetSeed(seed);

            _encryptionKey = encryptionKey;
        }

        #region [ -- Implementation of abstract base class -- ]

        /// <inheritdoc />
        protected override byte[] EncryptImplementation(byte[] message)
        {
            // Creating encryption stream.
            using (var encStream = new MemoryStream())
            {
                // Simplifying life.
                var encWriter = new BinaryWriter(encStream);

                // Writing encryption key's fingerprint.
                var fingerprint = Util.Utilities.CreateSha256(_encryptionKey);
                encWriter.Write(fingerprint);

                // Writing encrypted AES key.
                var aesKey = CreateAesKey();
                var rsaEncrypter = new rsa.Encrypter(_encryptionKey); 
                var encryptedAesKey = rsaEncrypter.Encrypt(aesKey);
                encWriter.Write(encryptedAesKey.Length);
                encWriter.Write(encryptedAesKey);

                // Writing encrypted content.
                var aesEcnrypter = new aes.Encrypter(aesKey);
                var encrypted = aesEcnrypter.Encrypt(message);
                encWriter.Write(encrypted);
                return encStream.ToArray();
            }
        }

        /*
         * Creates a symmetric AES encryption key, to encrypt payload.
         */
        byte[] CreateAesKey()
        {
            var bytes = new byte[32];
            _csrng.NextBytes(bytes);
            return bytes;
        }

        #endregion
    }
}
