/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using magic.utils;

namespace magic.node.extensions.hyperlambda
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
                                yield return StringLiteralParser.ReadMultiLineString(_reader);
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
                            yield return StringLiteralParser.ReadQuotedString(_reader);
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
                        yield return "\r\n";
                        break;

                    case '\n':
                        if (builder.Length > 0)
                        {
                            yield return builder.ToString();
                            builder.Clear();
                        }
                        _reader.Read(); // Discarding '\n'.
                        yield return "\r\n";
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
    }
}
