/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Text;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Parameters;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.lib.aes
{
    /// <summary>
    /// AES decrypter class that helps you decrypt an AES message.
    /// </summary>
    public class Decrypter : Util.DecrypterBase
    {
        readonly byte[] _symmetricKey;

        #region [ -- Constructors -- ]

        /// <summary>
        /// Creates a new AES encrypter, allowing you to encrypt one or more packages
        /// using the specified key.
        /// </summary>
        /// <param name="symmetricKey">Encryption key to use for encryption operation(s). The key will be converted to byte[32] using SHA256.</param>
        public Decrypter(string symmetricKey)
        {
            _symmetricKey = Util.Utilities.CreateSha256(Encoding.UTF8.GetBytes(symmetricKey));
        }

        /// <summary>
        /// Creates a new AES decrypter, allowing you to decrypt one or more packages
        /// using the specified key.
        /// </summary>
        /// <param name="symmetricKey">Key to use for decryption operation(s)</param>
        public Decrypter(byte[] symmetricKey)
        {
            _symmetricKey = symmetricKey;
        }

        #endregion

        #region [ -- Implementation of abstract base class -- ]

        /// <inheritdoc />
        protected override byte[] DecryptImplementation(byte[] message)
        {
            using (var stream = new MemoryStream(message))
            {
                using (var reader = new BinaryReader(stream))
                {
                    // Reading and discarding nonce.
                    var nonce = reader.ReadBytes(Constants.NONCE_SIZE);

                    // Creating and initializing AES engine.
                    var cipher = new GcmBlockCipher(new AesEngine());
                    var parameters = new AeadParameters(new KeyParameter(_symmetricKey), Constants.MAC_SIZE, nonce, null);
                    cipher.Init(false, parameters);

                    // Reading encrypted parts, and decrypting into result.
                    var encrypted = reader.ReadBytes(message.Length - nonce.Length);
                    var result = new byte[cipher.GetOutputSize(encrypted.Length)];
                    var len = cipher.ProcessBytes(encrypted, 0, encrypted.Length, result, 0);
                    cipher.DoFinal(result, len);

                    // Returning result as byte[].
                    return result;
                }
            }
        }

        #endregion
    }
}
