/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Text;
using System.Security.Cryptography;

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
        /// Minimum length of an auth secret for the system to be considered setup.
        /// </summary>
        public const int MinSecretLength = 50;

        /*
         * Signing key used while the system has no proper secret, which is when a new
         * cloudlet is waiting for its setup process. Random per process and never persisted,
         * such that tokens created before setup cannot be forged, and die on restart.
         */
        static readonly byte[] _bootstrapKey = RandomNumberGenerator.GetBytes(32);

        /// <summary>
        /// Returns true if the specified secret is long enough for the system to be considered setup.
        /// </summary>
        /// <param name="secret">Raw auth secret from configuration.</param>
        /// <returns>True if the secret is a proper secret.</returns>
        public static bool IsConfigured(string secret)
        {
            return secret?.Length >= MinSecretLength;
        }

        /// <summary>
        /// Returns the key bytes for the specified secret, or a random per process key
        /// if the secret is missing or too short to be a proper secret.
        /// </summary>
        /// <param name="secret">Raw auth secret from configuration.</param>
        /// <returns>Key bytes to use for JWT signing and validation.</returns>
        public static byte[] GetKeyBytes(string secret)
        {
            return IsConfigured(secret) ? Encoding.UTF8.GetBytes(secret) : _bootstrapKey;
        }
    }
}
