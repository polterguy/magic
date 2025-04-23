/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using magic.node.extensions;

namespace magic.lambda.crypto.lib.utilities
{
    /// <summary>
    /// Utility class with helper methods.
    /// </summary>
    public static class Utilities
    {
        /// <summary>
        /// Creates a string fingerprint from the specified content by creating
        /// a SHA256 of the specified content, and then returning the hash in
        /// fingerprint format to the caller.
        /// </summary>
        /// <param name="content">Content to hash</param>
        /// <returns>Fingerprint representation of hash generated from content</returns>
        public static string CreateSha256Fingerprint(byte[] content)
        {
            using (var hash = SHA256.Create())
            {
                var hashed = hash.ComputeHash(content);
                return CreateFingerprint(hashed);
            }
        }

        /// <summary>
        /// Creates a fingerprint representation of the specified byte[] content.
        /// </summary>
        /// <param name="content">32 bytes long array of bytes</param>
        /// <returns>Fingerprint representation of content</returns>
        public static string CreateFingerprint(byte[] content)
        {
            // Sanity checking invocation.
            if (content.Length != 32)
                throw new HyperlambdaException($"Cannot create a fingerprint from your content, since it was {content.Length} long. It must be 32 bytes.");

            // Creating a fingerprint in the format of "09fe-de45-..." of the 32 bytes long argument.
            var result = new StringBuilder();
            var idxNo = 0;
            foreach (var idx in content)
            {
                result.Append(BitConverter.ToString(new byte[] { idx }));
                if (++idxNo % 2 == 0)
                    result.Append("-");
            }
            return result.ToString().TrimEnd('-').ToLowerInvariant();
        }

        /// <summary>
        /// Returns fingerprint of key used to encrypt or sign a message.
        /// </summary>
        /// <param name="content">Where fingerprint is expected to be found</param>
        /// <returns>SHA256 of some key used in a cryptographic operation</returns>
        public static byte[] GetPackageFingerprint(byte[] content)
        {
            // Creating decryption stream.
            using (var encStream = new MemoryStream(content))
            {
                // Simplifying life.
                var encReader = new BinaryReader(encStream);

                // Discarding encryption key's fingerprint.
                return encReader.ReadBytes(32);
            }
        }

        /*
         * Helper method to generate a 256 bits 32 byte[] long key from a passphrase.
         */
        /// <summary>
        /// Creates a 32 bytes long key from the specified password by hashing it using SHA256.
        /// </summary>
        /// <param name="passphrase">Passphrase to generate key from</param>
        /// <returns>32 bytes long byte array found by hashing passphrase argument</returns>
        public static byte[] Generate256BitKey(string passphrase)
        {
            using (var hash = SHA256.Create())
            {
                return hash.ComputeHash(Encoding.UTF8.GetBytes(passphrase));
            }
        }

        /// <summary>
        /// Hashes the specified content using SHA256, and returns the hash to caller.
        /// </summary>
        /// <param name="content">Content to hash</param>
        /// <returns></returns>
        public static byte[] CreateSha256(byte[] content)
        {
            using (var algo = SHA256.Create())
            {
                return algo.ComputeHash(content);
            }
        }

        /// <summary>
        /// Reads the rest of some stream, and returns to caller as a byte array.
        /// </summary>
        /// <param name="stream">Stream to read from</param>
        /// <returns>Byte array containing the rest of the content from the stream</returns>
        public static byte[] ReadRestOfStream(Stream stream)
        {
            using (var tmp = new MemoryStream())
            {
                stream.CopyTo(tmp);
                return tmp.ToArray();
            }
        }
    }
}
