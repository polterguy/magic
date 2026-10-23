/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using magic.node.extensions.hyperlambda.helpers;

namespace magic.node.extensions.hyperlambda.internals
{
    /*
     * Single pass Hyperlambda parser, reading directly from a string and building nodes as it goes.
     *
     * This does what HyperlambdaTokenizer and a node builder consuming its tokens used to do, fused together,
     * without a stream reader, a token list or token objects in between. Every method below mirrors the
     * HyperlambdaTokenizer method of the same name, and the previous token's type is tracked because the
     * node building depends on it.
     */
    internal sealed class FastParser
    {
        readonly string _s;
        readonly int _n;
        readonly bool _keepComments;
        readonly Node _result = new Node();
        int _p;
        Node _parent;
        Node _node;
        int _level;
        TokenType _previous = TokenType.CRLF;

        FastParser(string hyperlambda, bool comments, bool skipBom)
        {
            _s = hyperlambda;
            _n = hyperlambda.Length;
            _keepComments = comments;
            _parent = _result;

            // The original implementation encoded the string as UTF8, where a StreamReader discards a BOM.
            if (skipBom && _n > 0 && _s[0] == '﻿')
                _p = 1;
        }

        internal static Node Parse(string hyperlambda, bool comments, bool skipBom)
        {
            var parser = new FastParser(hyperlambda, comments, skipBom);
            parser.Run();
            return parser._result;
        }

        #region [ -- Tokenizer methods, emitting events instead of tokens -- ]

        void Run()
        {
            while (_p < _n)
            {
                ReadCRLFSPNameOrComment();
                if (_p >= _n)
                    break;

                EatSeparator();
                if (_p >= _n)
                    break;

                ReadTypeSeparatorOrValue();
                if (_p >= _n)
                    break;

                EatCRLF();
            }
        }

        // Creates an exception telling the caller roughly where in the Hyperlambda the problem is.
        HyperlambdaException Error(string message)
        {
            var line = 1;
            for (var idx = 0; idx < _p && idx < _n; idx++)
            {
                if (_s[idx] == '\n')
                    line++;
            }
            return new HyperlambdaException($"{message} near line {line}");
        }

        // Equivalent of StreamReader.Peek, which returns -1 at EOF, and (char)-1 is '￿'.
        char Peek()
        {
            return _p < _n ? _s[_p] : '￿';
        }

        void ReadCRLFSPNameOrComment()
        {
            while (true)
            {
                SkipCRLF();
                if (_p >= _n)
                    break;

                ReadSpaceToken();
                if (_p >= _n)
                    break;

                if (!ReadNameOrComment() || _p >= _n)
                    break;
            }
        }

        bool ReadNameOrComment()
        {
            if (Peek() == ':')
            {
                OnName("");
                return false;
            }

            var current = _s[_p++];
            var next = Peek();

            if (current == '/' && next == '*')
            {
                ReadMultiLineComment();
                return true;
            }

            if (current == '/' && next == '/')
            {
                ReadSingleLineComment();
                return true;
            }

            if (current == '@' && next == '"')
            {
                _p++;
                OnName(ReadMultiLineString());
                return false;
            }

            if (current == '"' || current == '\'')
            {
                OnName(ReadQuotedString(current));
                return false;
            }

            ReadName();
            return false;
        }

        void ReadTypeSeparatorOrValue()
        {
            if (ReadTypeOrValue() && _p < _n)
            {
                EatSeparator();
                if (_p < _n)
                    ReadTypeOrValue();
            }
        }

        bool ReadTypeOrValue()
        {
            var current = Peek();
            if (current == '\r' || current == '\n')
            {
                if (_previous == TokenType.Separator)
                    OnValue("");
                return false;
            }
            _p++;
            var next = Peek();
            if (current == '@' && next == '"')
            {
                _p++;
                OnValue(ReadMultiLineString());
                EnsureEndOfLine();
                return false;
            }
            else if (current == '"' || current == '\'')
            {
                OnValue(ReadQuotedString(current));
                EnsureEndOfLine();
                return false;
            }
            return ReadType();
        }

        void ReadSingleLineComment()
        {
            // Discarding second '/' character.
            _p++;
            if (!ReadLine(out var start, out var length))
                return;

            var line = _s.AsSpan(start, length).Trim();
            if (line.Length > 0)
                OnComment(_keepComments ? line.ToString() : null);
        }

        void ReadMultiLineComment()
        {
            var comment = ReadMultiLineCommentText();
            if (comment == null)
            {
                if (_p >= _n)
                    throw Error("EOF encountered before end of multi line comment");
            }
            else
            {
                OnComment(comment);
            }
        }

        string ReadMultiLineCommentText()
        {
            var builder = new StringBuilder();
            while (true)
            {
                ReadLine(out var start, out var length);
                var line = _s.Substring(start, length);
                var trimmed = line.TrimStart(' ').Trim();
                if (trimmed.StartsWith("* "))
                    trimmed = trimmed[2..];
                else if (trimmed.StartsWith('*'))
                    trimmed = trimmed[1..];
                if (builder.Length == 0 && line.EndsWith("*/") && trimmed == "/")
                    return null; // Empty comment
                builder.Append(trimmed).Append("\r\n");
                if (line.EndsWith("*/"))
                    break;
                if (_p >= _n)
                    return null;
            }
            var comment = builder.ToString();
            return comment.Substring(0, comment.Length - 4).Trim();
        }

        void ReadSpaceToken()
        {
            // Only creating space tokens for SP characters followed by something besides CR/LF, or EOF.
            while (true)
            {
                if (_p >= _n)
                    return;

                var start = _p;
                while (_p < _n && _s[_p] == ' ')
                    _p++;
                var count = _p - start;
                if (count == 0)
                    return;
                if (_p >= _n)
                    return; // Trailing SP characters at EOF.

                var next = _s[_p];
                if (next == '\n' || next == '\r')
                {
                    // Line with only spaces, discarding it and everything up to the next non CR/LF character.
                    _p++;
                    SkipCRLF();
                }
                else
                {
                    if (count % 3 != 0)
                        throw Error("Not correct number of spaces");
                    OnSpace(count);
                }
            }
        }

        void EatSeparator()
        {
            if (Peek() == ':')
            {
                _p++;
                OnSeparator();
            }
        }

        void EatCRLF()
        {
            SkipCRLF();
            _previous = TokenType.CRLF;
        }

        void SkipCRLF()
        {
            while (_p < _n && (_s[_p] == '\r' || _s[_p] == '\n'))
                _p++;
        }

        void ReadName()
        {
            var start = _p - 1;
            var end = IndexOfAny(_p, ':', '\r', '\n');
            _p = end;
            OnName(_s.Substring(start, end - start));
        }

        bool ReadType()
        {
            var start = _p - 1;
            var end = IndexOfAny(_p, ':', '\r', '\n');
            _p = end;
            var text = _s.AsSpan(start, end - start).Trim().ToString();
            if (end < _n && _s[end] == ':')
            {
                OnType(text);
                return true;
            }
            OnValue(text);
            return false;
        }

        // Makes sure the remainder of the line is empty after a string literal.
        void EnsureEndOfLine()
        {
            if (_p < _n && _s[_p] != '\r' && _s[_p] != '\n')
                throw Error("Garbage characters after string literal");
        }

        // Reads next line, advancing past its terminator, and returns false if we're at EOF.
        bool ReadLine(out int start, out int length)
        {
            start = _p;
            length = 0;
            if (_p >= _n)
                return false;
            var end = IndexOfAny(_p, '\r', '\n', '\n');
            length = end - _p;
            _p = end;
            if (_p < _n)
            {
                var terminator = _s[_p++];
                if (terminator == '\r' && _p < _n && _s[_p] == '\n')
                    _p++;
            }
            return true;
        }

        int IndexOfAny(int from, char a, char b, char c)
        {
            var idx = _s.AsSpan(from).IndexOfAny(a, b, c);
            return idx < 0 ? _n : from + idx;
        }

        #endregion

        #region [ -- String literals -- ]

        /*
         * Reads a multi line string literal, assuming the opening @" has already been consumed. Only allocates
         * a builder if the literal contains a doubled quote.
         */
        string ReadMultiLineString()
        {
            StringBuilder builder = null;
            var segment = _p;
            var from = _p;
            while (true)
            {
                var idx = _s.IndexOf('"', from);
                if (idx < 0)
                    throw Error("String literal not closed before end of input");
                if (idx + 1 < _n && _s[idx + 1] == '"')
                {
                    // Doubled quote, implying one literal quote character.
                    builder ??= new StringBuilder();
                    builder.Append(_s, segment, idx + 1 - segment);
                    segment = from = idx + 2;
                    continue;
                }
                _p = idx + 1;
                if (builder == null)
                    return _s.Substring(segment, idx - segment);
                return builder.Append(_s, segment, idx - segment).ToString();
            }
        }

        /*
         * Reads a single line string literal, assuming the opening quote has already been consumed. Only
         * allocates a builder if the literal contains an escape character.
         */
        string ReadQuotedString(char endCharacter)
        {
            var start = _p;
            var idx = _s.AsSpan(_p).IndexOfAny(endCharacter, '\\');
            if (idx < 0)
                throw Error("Syntax error, string literal not closed before end of input");
            idx += _p;
            if (_s[idx] == endCharacter)
            {
                _p = idx + 1;
                return _s.Substring(start, idx - start);
            }

            var builder = new StringBuilder();
            builder.Append(_s, start, idx - start);
            _p = idx;
            while (_p < _n)
            {
                var c = _s[_p++];
                if (c == endCharacter)
                    return builder.ToString();
                if (c == '\\')
                    builder.Append(GetEscapeCharacter(endCharacter));
                else
                    builder.Append(c);
            }
            throw Error("Syntax error, string literal not closed before end of input");
        }

        string GetEscapeCharacter(char endCharacter)
        {
            if (_p >= _n)
                throw Error("End of input found when looking for escape character in single line string literal");
            var ch = _s[_p++];
            if (ch == endCharacter)
                return endCharacter.ToString();

            switch (ch)
            {
                case '"': return "\"";
                case '\'': return "'";
                case '\\': return "\\";
                case 'a': return "\a";
                case 'b': return "\b";
                case 'f': return "\f";
                case 't': return "\t";
                case 'v': return "\v";
                case 'n': return "\n";
                case 'r': return "\r";
                case '@': return "\\@";
                default: throw Error("Invalid escape sequence found in string literal");
            }
        }

        #endregion

        #region [ -- Node building -- ]

        void OnName(string value)
        {
            if (_previous == TokenType.CRLF)
            {
                _parent = _result;
                _level = 0;
            }
            if (_keepComments && _parent.Name == "..")
                throw Error($"Tried to add a child node of a comment node having the value of {_parent.Value}");
            _node = new Node(value);
            _parent.Add(_node);
            _previous = TokenType.Name;
        }

        void OnSeparator()
        {
            if (_previous == TokenType.Name && _node != null)
                _node.Value = "";
            _previous = TokenType.Separator;
        }

        void OnType(string value)
        {
            if (_node != null)
                _node.Value = value;
            _previous = TokenType.Type;
        }

        void OnValue(string value)
        {
            if (_node != null)
            {
                if (string.IsNullOrEmpty(_node.Get<string>()))
                    _node.Value = value;
                else
                    _node.Value = Converter.ToObject(value, _node.Get<string>());
            }
            _previous = TokenType.Value;
        }

        // A comment is always followed by a CR/LF token, which is why this ends up with CRLF as the previous token.
        void OnComment(string text)
        {
            if (_keepComments)
            {
                if (_previous == TokenType.CRLF)
                {
                    _parent = _result;
                    _level = 0;
                }
                _parent.Add(new Node("..", text));
            }
            _previous = TokenType.CRLF;
        }

        void OnSpace(int length)
        {
            var newLevel = length / 3;
            if (newLevel > _level + 1)
                throw Error("Too many spaces found in Hyperlambda content");
            if (newLevel == _level + 1)
            {
                _parent = _parent.Children.Last();
                _level = newLevel;
            }
            else
            {
                while (_level > newLevel)
                {
                    _parent = _parent.Parent;
                    --_level;
                }
            }
            _previous = TokenType.Space;
        }

        #endregion
    }
}
