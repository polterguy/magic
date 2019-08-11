/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;

namespace magic.hyperlambda
{
    public sealed class Tokenizer
    {
        StreamReader _reader;

        public Tokenizer(StreamReader reader)
        {
            _reader = reader ?? throw new ArgumentNullException(nameof(reader));
        }

        public IEnumerable<string> GetTokens()
        {
            var builder = new StringBuilder();
            while (!_reader.EndOfStream)
            {
                var current = (char)_reader.Peek();
                switch (current)
                {
                    case ':':
                        if (builder.Length > 0)
                        {
                            yield return builder.ToString();
                            builder.Clear();
                        }
                        _reader.Read(); // Discarding ':'.
                        yield return ":";
                        break;

                    case '@':
                        if (builder.Length > 0)
                        {
                            builder.Append(current);
                            _reader.Read();
                        }
                        else
                        {
                            _reader.Read(); // Discarding '@'.
                            var next = (char)_reader.Read();
                            if (next == '"')
                            {
                                yield return ReadMultiLineString(_reader);
                                builder.Clear();
                            }
                            else
                            {
                                builder.Append('@');
                                builder.Append(next);
                            }
                        }
                        break;

                    case '"':
                    case '\'':
                        if (builder.Length > 0)
                        {
                            builder.Append(current);
                            _reader.Read();
                        }
                        else
                        {
                            yield return ReadQuotedString(_reader);
                            builder.Clear();
                        }
                        break;

                    case '\r':
                        if (builder.Length > 0)
                        {
                            yield return builder.ToString();
                            builder.Clear();
                        }
                        _reader.Read(); // Discarding '\r'.
                        if (_reader.EndOfStream)
                            throw new ApplicationException("CR/LF error close to EOF");
                        var lf = (char)_reader.Read();
                        if (lf != '\n')
                            throw new ApplicationException("CR/LF error in Hyperlambda");
                        yield return "\n";
                        break;

                    case '\n':
                        if (builder.Length > 0)
                        {
                            yield return builder.ToString();
                            builder.Clear();
                        }
                        _reader.Read(); // Discarding '\n'.
                        yield return "\n";
                        break;

                    case '/':
                        if (builder.Length > 0)
                        {
                            _reader.Read(); // Discarding '/' character.
                            builder.Append('/');
                        }
                        else
                        {
                            _reader.Read(); // Discarding current '/'.
                            if (_reader.Peek() == '/')
                            {
                                // Eating the rest of the line.
                                while (!_reader.EndOfStream && (char)_reader.Peek() != '\n')
                                {
                                    _reader.Read();
                                }
                            }
                            else if (_reader.Peek() == '*')
                            {
                                // Eating until "*/".
                                var seenEndOfComment = false;
                                while (!_reader.EndOfStream && !seenEndOfComment)
                                {
                                    var idxComment = _reader.Read();
                                    if (idxComment == '*')
                                    {
                                        // Checking if we're at end of comment.
                                        if (_reader.Peek() == '/')
                                        {
                                            _reader.Read();
                                            seenEndOfComment = true;
                                        }
                                    }
                                }
                                if (!seenEndOfComment && _reader.EndOfStream)
                                    throw new ApplicationException("Syntax error in comment close to end of Hyperlambda");
                            }
                            else
                            {
                                builder.Append(current); // Only a part of the current token.
                            }
                        }
                        break;

                    case ' ':
                        _reader.Read(); // Discarding current ' '.
                        if (builder.Length > 0)
                        {
                            builder.Append(current);
                        }
                        else
                        {
                            builder.Append(' ');
                            while(!_reader.EndOfStream && (char)_reader.Peek() == ' ')
                            {
                                _reader.Read();
                                builder.Append(' ');
                            }
                            if (!_reader.EndOfStream && builder.Length % 3 != 0)
                                throw new ApplicationException("Odd number of spaces found in Hyperlambda file");
                            yield return builder.ToString();
                            builder.Clear();
                        }
                        break;

                    default:
                        builder.Append(current);
                        _reader.Read();
                        break;
                }
            }

            // Returning the last token, if any.
            if (builder.Length > 0)
                yield return builder.ToString();
        }

        #region [ -- Private helper methods -- ]

        static string ReadMultiLineString(StreamReader reader)
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

        static string ReadQuotedString(StreamReader reader)
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
