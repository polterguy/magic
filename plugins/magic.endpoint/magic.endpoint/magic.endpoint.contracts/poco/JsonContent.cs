/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;

namespace magic.endpoint.contracts.poco
{
    /// <summary>
    /// JSON that has already been created, UTF8 encoded, which is how it is sent to the client.
    ///
    /// Used as the content of a MagicResponse when an endpoint returns a lambda object, such that the JSON is created
    /// only once, and never as a string.
    /// </summary>
    public sealed class JsonContent
    {
        /// <summary>
        /// Creates an instance of the class.
        /// </summary>
        /// <param name="utf8">The JSON, UTF8 encoded.</param>
        public JsonContent(byte[] utf8)
        {
            Utf8 = utf8;
        }

        /// <summary>
        /// The JSON, UTF8 encoded.
        /// </summary>
        public byte[] Utf8 { get; }

        /// <summary>
        /// Returns the JSON as a string.
        /// </summary>
        public override string ToString()
        {
            return Encoding.UTF8.GetString(Utf8);
        }
    }
}
