/*
* Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
* See the enclosed LICENSE file for details.
*/

using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using magic.node.extensions.hyperlambda.internals;

namespace magic.node.extensions.hyperlambda.helpers
{
    /// <summary>
    /// Tokenizer for Hyperlambda allowing you to easily tokenize a snippet of Hyperlambda.
    /// </summary>
    public class HyperlambdaTokenizer
    {
        readonly StreamReader _reader;
        readonly List<Token> _tokens = new List<Token>();

        /// <summary>
        /// Creates an instance of your object, and reads all tokens from the specified stream
        /// </summary>
        /// <param name="stream">Stream object to read tokens from</param>
        public HyperlambdaTokenizer(Stream stream)
        {
            // Creating our stream reader which we're internally using to read tokens from the specified stream.
            _reader = new StreamReader(stream);

            // Looping until EOF of stream.
            while (!_reader.EndOfStream)
            {
                // Reads CR/LF, SP, Name or Comment tokens from stream.
                ReadCRLFSPNameOrComment();

                // Verifying we've still got more characters in stream.
                if (_reader.EndOfStream)
                    break;

                // A separator might occur after a node's name.
                EatSeparator();

                // Verifying we've still got more characters in stream.
                if (_reader.EndOfStream)
                    break;

                // Reads the type, separator or value from stream
                ReadTypeSeparatorOrValue();
 
                // Verifying we've still got more characters in stream.
                if (_reader.EndOfStream)
                    break;

                // A CR/LF sequence might occur after the node's name or value.
                EatCRLF();
            }
        }

        /// <summary>
        /// Returns all tokens to the caller.
        /// </summary>
        /// <returns></returns>
        public List<Token> Tokens()
        {
            // Returning tokens to caller.
            return _tokens;
        }

        #region [ -- Private helper methods -- ]

        #region [ -- Undetermined methods -- ]

        /*
         * These next methods don't entirely know which type of token we are dealing with next in our stream,
         * and hence needs to read one or more characters before we know the type of token, for then to invoke
         * the specialised method for handling that particular token, depending upon what characters are next
         * in the stream.
         */

        /*
         * Reads CR/LF, SP, Name, or Comment tokens from stream.
         */
        void ReadCRLFSPNameOrComment()
        {
            /*
             * Initially, and after a value, comment or name CR/LF sequence, we can only have SP tokens,
             * comments, or names.
             */
            while (true)
            {
                // Skipping initial CR/LF sequences.
                ParserHelper.EatCRLF(_reader);

                // Verifying we've still got more characters in stream.
                if (_reader.EndOfStream)
                    break;

                // Space tokens should only occur before names and comments.
                ReadSpaceToken();

                // Verifying we've still got more characters in stream.
                if (_reader.EndOfStream)
                    break;

                // The next token, if any, purely logically must be a name token, or a comment token.
                if (!ReadNameOrComment() || _reader.EndOfStream)
                    break;
            }
        }

        /*
         * Reads the next name or comment in the stream, and returns true if token was a comment.
         */
        bool ReadNameOrComment()
        {
            // If the next character is a ':' character, this node has an empty name.
            if ((char)_reader.Peek() == ':')
            {
                _tokens.Add(new Token(TokenType.Name, "")); // Empty name
                return false;
            }

            // Reading the next TWO characters to figure out which type of token the next token in the stream actually is.
            var current = (char)_reader.Read();
            var next = (char)_reader.Peek();

            // Checking if this is a multi line comment
            if (current == '/' && next == '*')
            {
                // Multiline comment.
                ReadMultiLineComment();
                return true; // Is comment.
            }

            // Checking if this is a single line comment.
            if (current == '/' && next == '/')
            {
                // Single line comment.
                ReadSingleLineComment();
                return true; // Is comment.
            }

            // Checking if this is a multiline string.
            if (current == '@' && next == '"')
            {
                // Multiline string.
                _reader.Read(); // Discarding '"' character.
                _tokens.Add(new Token(TokenType.Name, ParserHelper.ReadMultiLineString(_reader)));
                return false;
            }

            // Checking if this is a single line string.
            if (current == '"' || current == '\'')
            {
                // Single line string.
                _tokens.Add(new Token(TokenType.Name, ParserHelper.ReadQuotedString(_reader, current)));
                return false;
            }

            // Normal node name, without quotes.
            ReadName(current);
            return false;
        }

        /*
         * Reads the type, separator or value from stream.
         */
        void ReadTypeSeparatorOrValue()
        {
            // A type or value might occur after a the separator following the node's name.
            if (ReadTypeOrValue() && !_reader.EndOfStream)
            {
                // Above invocation returned type token, hence now reading value.
                EatSeparator();
                if (!_reader.EndOfStream)
                    ReadTypeOrValue();
            }
        }

        /*
         * Reads the next type or value declaration from the stream and
         * returns true if we found a type declaration, false if not.
         */
        bool ReadTypeOrValue()
        {
            // Reading next character from stream.
            var current = (char)_reader.Peek();

            // Checking if we're done with current line.
            if (current == '\r' || current == '\n')
            {
                if (_tokens.LastOrDefault()?.Type == TokenType.Separator)
                    _tokens.Add(new Token(TokenType.Value, "")); // Empty string value (not null)
                return false;
            }
            _reader.Read();
            var next = (char)_reader.Peek();
            if (current == '@' && next == '"')
            {
                // Multi line string.
                ReadMultiLineString();
                return false;
            }
            else if (current == '"' || current == '\'')
            {
                // Single line string.
                ReadSingleLineString(current);
                return false;
            }
            else
            {
                // Normal node name, without quotes.
                ReadType(current, ref next);
                return next == ':';
            }
        }

        #endregion

        /*
         * Reads single line comment from stream.
         */
        void ReadSingleLineComment()
        {
            // Discarding '/' character.
            _reader.Read();
            var line = _reader.ReadLine()?.Trim();
            if (!string.IsNullOrEmpty(line))
            {
                _tokens.Add(new Token(TokenType.SingleLineComment, line));
                _tokens.Add(new Token(TokenType.CRLF, "\r\n"));
            }
        }

        /*
         * Reads multiline comment from stream.
         */
        void ReadMultiLineComment()
        {
            // Multi line comment.
            var comment = ParserHelper.ReadMultiLineComment(_reader);
            if (comment == null)
            {
                if (_reader.EndOfStream)
                    throw new HyperlambdaException($"EOF encountered before end of multi line comment start after:\r\n {string.Join("", _tokens.Select(x => x.Value))}");
            }
            else
            {
                _tokens.Add(new Token(TokenType.MultiLineComment, comment));
                _tokens.Add(new Token(TokenType.CRLF, "\r\n"));
            }
        }

        /*
         * Reads SP character and creates an SP token, if stream has SP characters at its current position.
         */
        void ReadSpaceToken()
        {
            /*
             * Notice, we only add space tokens that have some character behind it, besides CR or LF characters.
             *
             * This makes the parser more resilient towards erronous spacings in our Hyperlambda files.
             */
            while (true)
            {
                // Checking we're not at EOF.
                if (_reader.EndOfStream)
                    return;

                // Creating our buffer and reading all SP characters from stream.
                var builder = new StringBuilder();
                if (EatSpace(builder, out var next))
                    return;

                // Verifying we've got at least one SP character in buffer
                if (builder.Length > 0)
                    EatCRLF(builder, next);
                else
                    break;
            }
        }

        /*
         * Eats all SP characters and put into buffer, returns true if EOF.
         */
        bool EatSpace(StringBuilder builder, out char next)
        {
            next = (char)_reader.Peek();
            while (next == ' ')
            {
                builder.Append((char)_reader.Read());
                if (_reader.EndOfStream)
                    return true;
                next = (char)_reader.Peek();
            }
            return false;
        }

        /*
         * Reads the next separator (':' character) from the stream.
         */
        void EatSeparator()
        {
            if ((char)_reader.Peek() == ':')
            {
                _reader.Read();
                _tokens.Add(new Token(TokenType.Separator, ":"));
            }
        }

        /*
         * Reads the next CR/LF sequence from the stream.
         */
        void EatCRLF()
        {
            while(true)
            {
                var next = (char)_reader.Peek();
                if (_reader.EndOfStream || (next != '\n' && next != '\r'))
                    break;
                _reader.Read();
            }
            _tokens.Add(new Token(TokenType.CRLF, "\r\n"));
        }

        void EatCRLF(StringBuilder builder, char next)
        {
            if (next == '\n' || next == '\r')
            {
                _reader.Read();
                while (true)
                {
                    next = (char)_reader.Peek();
                    if (_reader.EndOfStream)
                        return;
                    if (next != '\r' && next != '\n')
                        return;
                    _reader.Read();
                }
            }
            else
            {
                // Next character is not SP, '\r' or '\n'.
                var spaces = builder.ToString();
                if (spaces.Length % 3 != 0)
                    throw new HyperlambdaException($"Not correct number of spaces after:\r\n {string.Join("", _tokens.Select(x => x.Value))}");
                _tokens.Add(new Token(TokenType.Space, spaces));
            }
        }

        /*
         * Reads name from stream.
         */
        void ReadName(char current)
        {
            var builder = new StringBuilder();
            builder.Append(current);
            while (true)
            {
                var next = (char)_reader.Peek();
                if (_reader.EndOfStream || next == ':' || next == '\r' || next == '\n')
                    break;
                builder.Append((char)_reader.Read());
            }
            _tokens.Add(new Token(TokenType.Name, builder.ToString()));
        }

        /*
         * Reads type from stream.
         */
        void ReadType(char current, ref char next)
        {
            var builder = new StringBuilder();
            builder.Append(current);
            while (true)
            {
                next = (char)_reader.Peek();
                if (_reader.EndOfStream || next == '\n' || next == '\r' || next == ':')
                    break;
                builder.Append((char)_reader.Read());
            }
            _tokens.Add(new Token(next == ':' ? TokenType.Type : TokenType.Value, builder.ToString().Trim()));
        }

        /*
         * Reads single line string from stream.
         */
        void ReadSingleLineString(char current)
        {
            _tokens.Add(new Token(TokenType.Value, ParserHelper.ReadQuotedString(_reader, current)));
            if (!_reader.EndOfStream)
            {
                var next = (char)_reader.Peek();
                if (next != '\r' && next != '\n')
                    throw new HyperlambdaException($"Garbage characters after: {string.Join("", _tokens.Select(x => x.Value))}");
            }
        }

        /*
         * Reads multiline string from stream.
         */
        void ReadMultiLineString()
        {
            // Skipping '"' character.
            _reader.Read();

            // Reading multiline string from stream.
            _tokens.Add(new Token(TokenType.Value, ParserHelper.ReadMultiLineString(_reader)));

            // Sanity checking syntax unless we're at EOF.
            if (!_reader.EndOfStream)
            {
                var next = (char)_reader.Peek();
                if (next != '\r' && next != '\n')
                    throw new HyperlambdaException($"Garbage characters after:\r\n {string.Join("", _tokens.Select(x => x.Value))}");
            }
        }

        #endregion
    }
}
