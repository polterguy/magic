/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Text;
using magic.node.extensions.hyperlambda.internals;

namespace magic.node.extensions.hyperlambda
{
    /// <summary>
    /// Class that helps you parse Hyperlambda and create a Lambda/node from it.
    /// </summary>
    public static class HyperlambdaParser
    {
        /// <summary>
        /// Creates a Lambda/node from the specified string Hyperlambda.
        /// </summary>
        /// <param name="hyperlambda">Hyperlambda to parse</param>
        /// <param name="comments">Whether or not to include comments semantically in the resulting lambda or not</param>
        /// <returns>The node representation of the specified Hyperlambda</returns>
        public static Node Parse(string hyperlambda, bool comments = false)
        {
            return FastParser.Parse(hyperlambda, comments, true);
        }

        /// <summary>
        /// Creates a Lambda/node from the specified stream assumed to contain Hyperlambda.
        /// </summary>
        /// <param name="stream">Stream containing Hyperlambda to parse</param>
        /// <param name="comments">Whether or not to include comments semantically in the resulting lambda or not</param>
        /// <returns>The node representation of the specified Hyperlambda</returns>
        public static Node Parse(Stream stream, bool comments = false)
        {
            string hyperlambda;
            using (var reader = new StreamReader(stream, Encoding.UTF8, true, -1, true))
            {
                hyperlambda = reader.ReadToEnd();
            }
            return FastParser.Parse(hyperlambda, comments, false);
        }
    }
}
