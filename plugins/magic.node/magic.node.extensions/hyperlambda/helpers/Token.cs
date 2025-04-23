/*
* Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
* See the enclosed LICENSE file for details.
*/

namespace magic.node.extensions.hyperlambda.helpers
{
    /// <summary>
    /// Token type declaring which token type the token actually is.
    /// </summary>
    public enum TokenType
    {
        /// <summary>
        /// CR/LF sequence type of token.
        /// </summary>
        CRLF,

        /// <summary>
        /// Comment spanning multiple lines.
        /// </summary>
        MultiLineComment,

        /// <summary>
        /// Name of node.
        /// </summary>
        Name,

        /// <summary>
        /// Separator tokenm (:)
        /// </summary>
        Separator,

        /// <summary>
        /// Comment spanning only one line.
        /// </summary>
        SingleLineComment,

        /// <summary>
        /// Space type of token, declaring scope of upcoming node.
        /// </summary>
        Space,

        /// <summary>
        /// Type declaration type of token.
        /// </summary>
        Type,

        /// <summary>
        /// Value of node type of token.
        /// </summary>
        Value
    };

    /// <summary>
    /// A single Hyperlambda token.
    /// </summary>
    public class Token
    {
        /// <summary>
        /// Creates an instance of your token.
        /// </summary>
        /// <param name="type">Type of token</param>
        /// <param name="value">String representation of token</param>
        public Token(TokenType type, string value)
        {
            Type = type;
            Value = value;
        }

        /// <summary>
        /// Returns the string representation value of your token.
        /// </summary>
        /// <value>Token value</value>
        public string Value { get; }

        /// <summary>
        /// Returns the token type.
        /// </summary>
        /// <value>Token type</value>
        public TokenType Type { get; internal set; }

        #region [ -- Overridden base class methods -- ]

        /// <inheritdoc />
        public override string ToString()
        {
            return Type + ":" + Value;
        }

        /// <inheritdoc />
        public override int GetHashCode()
        {
            return ToString().GetHashCode();
        }

        /// <inheritdoc />
        public override bool Equals(object obj)
        {
            return obj is Token token && token.ToString() == ToString();
        }

        #endregion
    }
}
