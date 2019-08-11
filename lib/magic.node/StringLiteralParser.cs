/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Text;

namespace magic.node
{
    public class StringLiteralParser
    {
        public static string ReadMultiLineString(StreamReader reader)
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

                    case '\n':
                        builder.Append("\n");
                        break;

                    case '\r':
                        if ((char)reader.Read() != '\n')
                            throw new Exception(string.Format("Unexpected CR found without any matching LF near '{0}'", builder));
                        builder.Append("\n");
                        break;

                    default:
                        builder.Append((char)c);
                        break;
                }
            }
            throw new Exception(string.Format("String literal not closed before end of input near '{0}'", builder));
        }

        public static string ReadQuotedString(StreamReader reader)
        {
            var endCharacter = (char)reader.Read();
            var builder = new StringBuilder();
            for (var c = reader.Read(); c != -1; c = reader.Read())
            {
                if (c == endCharacter)
                    return builder.ToString();

                switch (c)
                {
                    case '\\':
                        builder.Append(GetEscapeCharacter(reader, endCharacter));
                        break;

                    case '\n':
                    case '\r':
                        throw new ApplicationException(string.Format("Syntax error, string literal unexpected CR/LF"));

                    default:
                        builder.Append((char)c);
                        break;
                }
            }
            throw new ApplicationException(string.Format("Syntax error, string literal not closed before end of input"));
        }

        #region [ -- Private helper methods -- ]

        static string GetEscapeCharacter(StreamReader reader, char endCharacter)
        {
            var ch = reader.Read();
            if (ch == endCharacter)
                return endCharacter.ToString();

            switch (ch)
            {
                case -1:
                    throw new Exception("End of input found when looking for escape character in single line string literal");

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
                    if ((char)reader.Read() != '\\' || (char)reader.Read() != 'n')
                        throw new Exception("CR found, but no matching LF found");
                    return "\n";

                case 'x':
                    return HexaCharacter(reader);

                default:
                    throw new Exception("Invalid escape sequence found in string literal");
            }
        }

        static string HexaCharacter(StreamReader reader)
        {
            var hexNumberString = "";
            for (var idxNo = 0; idxNo < 4; idxNo++)
            {
                if (reader.EndOfStream)
                    throw new ApplicationException("EOF seen before escaped hex character was done reading");

                hexNumberString += (char)reader.Read();
            }
            var integerNo = Convert.ToInt32(hexNumberString, 16);
            return Encoding.UTF8.GetString(BitConverter.GetBytes(integerNo).Reverse().ToArray());
        }

        #endregion
    }
}
