/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.crypto
{
    /*
     * Helper class to retrieve common arguments.
     */
    internal static class Utilities
    {
        /*
         * Retrieves arguments specified to slot.
         */
        internal static (byte[] Message, byte[] Key, bool Raw) GetArguments(
            Node input,
            bool messageIsBase64,
            string keyName)
        {
            // Retrieving message as byte[], converting if necessary.
            var message = GetContent(input, messageIsBase64);

            // Retrieving key to use for cryptography operation.
            var key = GetKeyFromArguments(input, keyName);

            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;

            input.Clear();
            return (message, key, raw);
        }

        /*
         * Private helper method to return byte[] representation of key.
         */
        internal static byte[] GetKeyFromArguments(
            Node input,
            string keyType,
            bool throwOnMissing = true)
        {
            // Sanity checking invocation.
            var keys = input.Children.Where(x => x.Name == keyType);
            if (keys.Count() != 1)
            {
                if (throwOnMissing)
                    throw new HyperlambdaException($"You must provide a [{keyType}]");
                return Array.Empty<byte>();
            }

            // Retrieving key, making sure we support both base64 encoded, and raw byte[] keys.
            var key = keys.First()?.GetEx<object>();
            if (key is string strKey)
                return Convert.FromBase64String(strKey); // base64 encoded.

            return key as byte[]; // Assuming raw byte[] key.
        }

        /*
         * Returns content of node as byte[] for encryption/decryption.
         */
        internal static byte[] GetContent(Node input, bool base64 = false)
        {
            var contentObject = input.GetEx<object>() ??
                throw new HyperlambdaException("No content for cryptography operation");

            // Checking if content is already byte[].
            if (contentObject is byte[] bytes)
                return bytes;

            // Content is string, figuring out how to return it.
            if (base64)
                return Convert.FromBase64String((string)contentObject);
            else
                return Encoding.UTF8.GetBytes((string)contentObject);
        }

        /*
         * Returns byte[] representation of fingerprint used in invocation.
         */
        internal static byte[] GetFingerprint(Node input)
        {
            // Sanity checking invocation.
            var nodes = input.Children.Where(x => x.Name == "signing-key-fingerprint");
            if (nodes.Count() != 1)
                throw new HyperlambdaException($"You must provide [signing-key-fingerprint]");

            // Retrieving key, making sure we support both base64 encoded, and raw byte[] keys.
            var result = nodes.First()?.GetEx<object>();
            if (result is byte[] resultRaw)
            {
                if (resultRaw.Length != 32)
                    throw new HyperlambdaException("Fingerprint is not 32 bytes long");
                return resultRaw;
            }
            else
            {
                var resultFingerprint = (result as string).Replace("-", "");
                int noChars = resultFingerprint.Length;
                byte[] bytes = new byte[noChars / 2];
                for (int i = 0; i < noChars; i += 2)
                {
                    bytes[i / 2] = Convert.ToByte(resultFingerprint.Substring(i, 2), 16);
                }
                if (bytes.Length != 32)
                    throw new HyperlambdaException("Fingerprint is not 32 bytes long");
                return bytes;
            }
        }
    }
}
