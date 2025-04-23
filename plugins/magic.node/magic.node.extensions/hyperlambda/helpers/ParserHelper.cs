/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Text;

namespace magic.node.extensions.hyperlambda.internals
{
    /*
     * Helper class to help parse string literals, and other common tasks.
     */
    internal static class ParserHelper
    {
        /*
         * Reads a multline string literal, basically a string surrounded by @"".
         */
        internal static string ReadMultiLineString(StreamReader reader)
        {
            var builder = new StringBuilder();
            for (var c = reader.Read(); c != -1; c = reader.Read())
            {
                switch (c)
                {
                    case '"':
                        if ((char)reader.Peek() == '"')
                            builder.Append((char)reader.Read());
                        else
                            return builder.ToString();
                        break;

                    default:
                        builder.Append((char)c);
                        break;
                }
            }
            throw new HyperlambdaException(string.Format("String literal not closed before end of input near '{0}'", builder));
        }

        /*
         * Reads a single line string literal, basically a string surrounded by only "".
         */
        internal static string ReadQuotedString(StreamReader reader, char? endsWith = null)
        {
            var endCharacter = endsWith.HasValue ? endsWith.Value : (char)reader.Read();
            var builder = new StringBuilder();
            for (var c = reader.Read(); c != -1; c = reader.Read())
            {
                if (c == endCharacter)
                {
                    var result = builder.ToString();
                    return result;
                }

                switch (c)
                {
                    case '\\':
                        builder.Append(GetEscapeCharacter(reader, endCharacter));
                        break;

                    default:
                        builder.Append((char)c);
                        break;
                }
            }
            throw new HyperlambdaException("Syntax error, string literal not closed before end of input");
        }

        /*
         * Reads the next multiline comment in the specified stream, and returns it to caller if
         * we can find any upcoming comment.
         */
        internal static string ReadMultiLineComment(StreamReader reader)
        {
            var builder = new StringBuilder();
            while (true)
            {
                var line = reader.ReadLine();
                var trimmed = line.TrimStart(new char[] { ' ' }).Trim();
                if (trimmed.StartsWith("* "))
                    trimmed = trimmed[2..];
                else if (trimmed.StartsWith('*'))
                    trimmed = trimmed[1..];
                if (builder.Length == 0 && line.EndsWith("*/") && trimmed == "/")
                    return null; // Empty comment
                builder.Append(trimmed).Append("\r\n");
                if (line.EndsWith("*/"))
                    break;
                if (reader.EndOfStream)
                    return null;
            }
            if (builder.Length > 0)
            {
                var comment = builder.ToString();
                comment = comment.Substring(0, comment.Length - 4).Trim();
                return comment;
            }
            return null;
        }

        /*
         * Discards all upcoming CR or LF characters in the specified stream reader.
         */
        internal static void EatCRLF(StreamReader reader)
        {
            var next = (char)reader.Peek();
            while (!reader.EndOfStream && (next == '\r' || next == '\n'))
            {
                reader.Read(); // Discarding CR/LF character.
                next = (char)reader.Peek();
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Reads a single character from a single line string literal, escaped
         * with the '\' character.
         */
        static string GetEscapeCharacter(StreamReader reader, char endCharacter)
        {
            var ch = reader.Read();
            if (ch == endCharacter)
                return endCharacter.ToString();

            switch (ch)
            {
                case -1:
                    throw new HyperlambdaException("End of input found when looking for escape character in single line string literal");

                case '"':
                    return "\"";

                case '\'':
                    return "'";

                case '\\':
                    return "\\";

                case 'a':
                    return "\a";

                case 'b':
                    return "\b";

                case 'f':
                    return "\f";

                case 't':
                    return "\t";

                case 'v':
                    return "\v";

                case 'n':
                    return "\n";

                case 'r':
                    return "\r";

                default:
                    throw new HyperlambdaException("Invalid escape sequence found in string literal");
            }
        }

        #endregion
    }
}
