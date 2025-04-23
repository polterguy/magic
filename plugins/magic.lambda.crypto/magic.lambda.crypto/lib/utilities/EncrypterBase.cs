/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;

namespace magic.lambda.crypto.lib.utilities
{
    /// <summary>
    /// Abstract encryption class allowing for polymorphistically using an
    /// encryption algorithm of some sort.
    /// </summary>
    public abstract class EncrypterBase
    {
        /// <summary>
        /// Actual encrypt implementation method, that encrypts some specified message,
        /// intended to be implemented by derived classes.
        /// </summary>
        /// <param name="message">Message to encrypte</param>
        /// <returns>Raw bytes containing encrypted message</returns>
        protected abstract byte[] EncryptImplementation(byte[] message);

        #region [ -- Overloaded API methods to be used by client code -- ]

        /// <summary>
        /// Encrypts a message.
        /// </summary>
        /// <param name="message">Message you want to encrypt in raw byte format</param>
        /// <returns>Encrypted message in raw bytes format</returns>
        public byte[] Encrypt(byte[] message)
        {
            return EncryptImplementation(message);
        }

        /// <summary>
        /// Encrypts a message.
        /// </summary>
        /// <param name="message">Text message you want to encrypt</param>
        /// <returns>Encrypted message in raw bytes format</returns>
        public byte[] Encrypt(string message)
        {
            return EncryptImplementation(Encoding.UTF8.GetBytes(message));
        }

        /// <summary>
        /// Encrypts a message.
        /// </summary>
        /// <param name="message">Message you want to encrypt in raw byte format</param>
        /// <returns>Encrypted message as base64 encoded string</returns>
        public string EncryptToString(byte[] message)
        {
            return Convert.ToBase64String(EncryptImplementation(message));
        }

        /// <summary>
        /// Encrypts a message.
        /// </summary>
        /// <param name="message">Text message you want to encrypt</param>
        /// <returns>Encrypted message as base64 encoded string</returns>
        public string EncryptToString(string message)
        {
            return Convert.ToBase64String(EncryptImplementation(Encoding.UTF8.GetBytes(message)));
        }

        #endregion
    }
}
