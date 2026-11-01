/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.node.extensions.hyperlambda.helpers
{
    /// <summary>
    /// The kinds of tokens the Hyperlambda parser tracks while it reads, to know what it has just read.
    /// </summary>
    public enum TokenType
    {
        /// <summary>
        /// CR/LF sequence type of token.
        /// </summary>
        CRLF,

        /// <summary>
        /// Name of node.
        /// </summary>
        Name,

        /// <summary>
        /// Separator between the name and the value of a node, a colon.
        /// </summary>
        Separator,

        /// <summary>
        /// Type declaration of a value.
        /// </summary>
        Type,

        /// <summary>
        /// Value of node.
        /// </summary>
        Value,

        /// <summary>
        /// Space characters, such as the indentation of a node.
        /// </summary>
        Space,
    }
}
