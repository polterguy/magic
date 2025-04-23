/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;

namespace magic.lambda.crypto.lib.utilities
{
    /// <summary>
    /// Abstract decryption class allowing for polymorphistically using a
    /// decryption algorithm of some sort.
    /// </summary>
    public abstract class DecrypterBase
    {
        /// <summary>
        /// Actual decrypt implementation method, that decrypts some specified message,
        /// intended to be implemented by derived classes.
        /// </summary>
        /// <param name="message">Message to decrypte</param>
        /// <returns>Raw bytes containing decrypted message</returns>
        protected abstract byte[] DecryptImplementation(byte[] message);

        #region [ -- Overloaded API methods to be used by client code -- ]

        /// <summary>
        /// Decrypts a message previously encrypted with the Encrypter equivalent.
        /// </summary>
        /// <param name="message">Encrypted message you want to decrypt in raw byte format</param>
        /// <returns>Decrypted message as raw bytes</returns>
        public byte[] Decrypt(byte[] message)
        {
            return DecryptImplementation(message);
        }

        /// <summary>
        /// Decrypts a message previously encrypted with the Encrypter equivalent.
        /// </summary>
        /// <param name="message">Encrypted message you want to decrypt in base64 encoded format</param>
        /// <returns>Decrypted message as raw bytes</returns>
        public byte[] Decrypt(string message)
        {
            return DecryptImplementation(Convert.FromBase64String(message));
        }

        /// <summary>
        /// Decrypts a message previously encrypted with the Encrypter equivalent.
        /// </summary>
        /// <param name="message">Encrypted message you want to decrypt in raw byte format</param>
        /// <returns>Decrypted message assumed to be encoded as a UTF8 string</returns>
        public string DecryptToString(byte[] message)
        {
            return Encoding.UTF8.GetString(DecryptImplementation(message));
        }

        /// <summary>
        /// Decrypts a message previously encrypted with the Encrypter equivalent.
        /// </summary>
        /// <param name="message">Encrypted message you want to decrypt in base64 encoded format</param>
        /// <returns>Decrypted message assumed to be encoded as a UTF8 string</returns>
        public string DecryptToString(string message)
        {
            return Encoding.UTF8.GetString(DecryptImplementation(Convert.FromBase64String(message)));
        }

        #endregion
    }
}
