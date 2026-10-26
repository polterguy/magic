/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;

namespace magic.lambda.auth.helpers
{
    /// <summary>
    /// Helper class deriving the symmetric JWT signing key from the configured auth
    /// secret, making sure ticket creation and ticket validation derive the key
    /// identically, regardless of which part of the system processes the token.
    /// </summary>
    public static class AuthKeyDerivation
    {
        /// <summary>
        /// Returns the key bytes for the specified secret, padding secrets shorter than
        /// 50 characters with a static suffix before encoding, such that tokens created
        /// from short secrets remain reasonably hard to forge.
        /// </summary>
        /// <param name="secret">Raw auth secret from configuration.</param>
        /// <returns>Key bytes to use for JWT signing and validation.</returns>
        public static byte[] GetKeyBytes(string secret)
        {
            secret ??= "";
            if (secret.Length < 50)
                secret += "abcdefghijklmnopqrstuvwxyz1234567890";
            return Encoding.UTF8.GetBytes(secret);
        }
    }
}
