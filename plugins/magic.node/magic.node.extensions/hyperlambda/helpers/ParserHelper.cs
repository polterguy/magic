/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node.extensions;

namespace magic.node.extensions.hyperlambda.internals
{
    /*
     * Helper class to help parse string literals, and other common tasks.
     */
    internal static class ParserHelper
    {
        /*
         * Returns the character an escape sequence represents, where [ch] is the character following the '\' character,
         * or -1 if the input ended there.
         */
        internal static string GetEscapeCharacter(int ch, char endCharacter)
        {
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

                case '@':
                    return "\\@";

                default:
                    throw new HyperlambdaException("Invalid escape sequence found in string literal");
            }
        }
    }
}
