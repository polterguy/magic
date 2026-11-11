/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Text;
using System.Collections.Generic;
using magic.node.extensions;

namespace magic.data.common.builders
{
    /*
     * Validates an SQL expression given as a column, group or order entry of a read, and returns it with
     * every identifier escaped, such that no SQL injection can occur through these entries.
     *
     * The expression is parsed according to the following grammar, and anything else is rejected.
     *
     *   expression := term ( operator term )*
     *   term       := number | string | "(" expression ")" | call | identifier
     *   call       := function "(" [ "distinct" ] [ "*" | expression ( "," expression )* ] ")"
     *              |  "cast" "(" expression "as" type [ "(" number [ "," number ] ")" ] ")"
     *   operator   := "+" | "-" | "*" | "/"
     *
     * A function must be one of the explicitly allowed function names, and every identifier is escaped,
     * so an identifier can never become SQL keywords. A string literal can only hold characters that can
     * never terminate it or escape its closing quote, and since a lone "*" is only accepted as the entire
     * argument list of a call, "/*" and "--" can never form a comment sequence. Nesting is limited to avoid
     * stack exhaustion through crafted input. Sub-selects, keywords such as "case" and "select", and
     * statement separators are rejected since they are not part of the grammar.
     */
    internal sealed class SqlExpression
    {
        const int MaxDepth = 8;
        const int MaxLength = 512;
        const string StringCharacters = " %-_:/.,";

        readonly string _expression;
        readonly ISet<string> _functions;
        readonly Func<string, string> _escape;
        readonly List<string> _tokens = new List<string>();
        int _position;
        int _depth;

        SqlExpression(string expression, ISet<string> functions, Func<string, string> escape)
        {
            _expression = expression;
            _functions = functions;
            _escape = escape;
        }

        /*
         * Returns the specified expression with its identifiers escaped, and the inline alias of an
         * expression ending with "as alias" when allowAlias is true, throwing if it does not follow the
         * grammar above.
         */
        internal static (string Sql, string Alias) Build(
            string expression,
            ISet<string> functions,
            Func<string, string> escape,
            bool allowAlias)
        {
            var parser = new SqlExpression(expression, functions, escape);
            if (expression.Length > MaxLength)
                throw parser.Error();
            parser.Tokenize();
            var sql = parser.Expression();
            string alias = null;
            if (allowAlias && string.Equals(parser.Peek(), "as", StringComparison.OrdinalIgnoreCase))
            {
                parser._position++;
                alias = parser.Next();
                if (!IsWord(alias))
                    throw parser.Error();
            }
            if (parser._position != parser._tokens.Count)
                throw parser.Error();
            return (sql, alias);
        }

        #region [ -- Private helper methods -- ]

        HyperlambdaException Error()
        {
            return new HyperlambdaException($"'{_expression}' is not a supported aggregate function expression");
        }

        /*
         * Splits the expression into identifiers, numbers, string literals and the symbols of the grammar.
         */
        void Tokenize()
        {
            var idx = 0;
            while (idx < _expression.Length)
                idx = ReadToken(idx);
        }

        int ReadToken(int idx)
        {
            var c = _expression[idx];
            if (char.IsWhiteSpace(c))
                return idx + 1;
            if (char.IsLetter(c) || c == '_')
                return ReadWhile(idx, x => char.IsLetterOrDigit(x) || x == '_' || x == '.');
            if (char.IsDigit(c))
                return ReadWhile(idx, x => char.IsDigit(x) || x == '.');
            if (c == '\'')
                return ReadString(idx);
            if (!"(),+-*/".Contains(c))
                throw Error();
            _tokens.Add(c.ToString());
            return idx + 1;
        }

        int ReadWhile(int start, Func<char, bool> predicate)
        {
            var idx = start;
            while (idx < _expression.Length && predicate(_expression[idx]))
                idx++;
            _tokens.Add(_expression.Substring(start, idx - start));
            return idx;
        }

        /*
         * A string literal can only hold letters, digits and the characters of StringCharacters, none of
         * which can terminate it or escape its closing quote in any of the supported databases.
         */
        int ReadString(int start)
        {
            var end = _expression.IndexOf('\'', start + 1);
            if (end == -1)
                throw Error();
            for (var idx = start + 1; idx < end; idx++)
            {
                if (!char.IsLetterOrDigit(_expression[idx]) && !StringCharacters.Contains(_expression[idx]))
                    throw Error();
            }
            _tokens.Add(_expression.Substring(start, end - start + 1));
            return end + 1;
        }

        string Peek(int offset = 0)
        {
            return _position + offset < _tokens.Count ? _tokens[_position + offset] : null;
        }

        string Next()
        {
            if (_position >= _tokens.Count)
                throw Error();
            return _tokens[_position++];
        }

        void Expect(string token)
        {
            if (Next() != token)
                throw Error();
        }

        string Expression()
        {
            var builder = new StringBuilder(Term());
            while (Peek() == "+" || Peek() == "-" || Peek() == "*" || Peek() == "/")
            {
                builder.Append(' ').Append(Next()).Append(' ');
                builder.Append(Term());
            }
            return builder.ToString();
        }

        string Term()
        {
            var token = Next();
            if (char.IsDigit(token[0]))
                return IsNumber(token) ? token : throw Error();
            if (token[0] == '\'')
                return token;
            if (token == "(")
            {
                Enter();
                var inner = Expression();
                Expect(")");
                _depth--;
                return "(" + inner + ")";
            }
            if (!IsIdentifier(token))
                throw Error();
            if (Peek() == "(")
                return Call(token.ToLowerInvariant());
            return _escape(token);
        }

        string Call(string function)
        {
            if (function != "cast" && !_functions.Contains(function))
                throw Error();
            Expect("(");
            Enter();
            var arguments = function == "cast" ? CastArguments() : Arguments();
            Expect(")");
            _depth--;
            return function + "(" + arguments + ")";
        }

        string CastArguments()
        {
            var builder = new StringBuilder(Expression());
            if (!string.Equals(Next(), "as", StringComparison.OrdinalIgnoreCase))
                throw Error();
            var type = Next();
            if (!IsWord(type))
                throw Error();
            builder.Append(" as ").Append(type);
            if (Peek() != "(")
                return builder.ToString();

            // Precision and scale, such as 'decimal(10,2)'.
            _position++;
            builder.Append('(').Append(Number());
            if (Peek() == ",")
            {
                _position++;
                builder.Append(',').Append(Number());
            }
            Expect(")");
            return builder.Append(')').ToString();
        }

        string Arguments()
        {
            if (Peek() == "*" && Peek(1) == ")")
                return Next();
            if (Peek() == ")")
                return "";
            var builder = new StringBuilder();
            if (string.Equals(Peek(), "distinct", StringComparison.OrdinalIgnoreCase) && Peek(1) != ")" && Peek(1) != "(")
            {
                _position++;
                builder.Append("distinct ");
            }
            builder.Append(Expression());
            while (Peek() == ",")
            {
                _position++;
                builder.Append(',').Append(Expression());
            }
            return builder.ToString();
        }

        string Number()
        {
            var token = Next();
            return IsNumber(token) ? token : throw Error();
        }

        void Enter()
        {
            if (++_depth > MaxDepth)
                throw Error();
        }

        /*
         * An identifier is one or more words separated by dots, such as 'table.column'.
         */
        static bool IsIdentifier(string token)
        {
            foreach (var idx in token.Split('.'))
            {
                if (!IsWord(idx))
                    return false;
            }
            return true;
        }

        static bool IsWord(string token)
        {
            if (string.IsNullOrEmpty(token) || char.IsDigit(token[0]))
                return false;
            foreach (var idx in token)
            {
                if (!(idx < 128 && (char.IsLetterOrDigit(idx) || idx == '_')))
                    return false;
            }
            return true;
        }

        static bool IsNumber(string token)
        {
            var dots = 0;
            foreach (var idx in token)
            {
                if (idx == '.')
                    dots++;
                else if (!char.IsDigit(idx))
                    return false;
            }
            return dots <= 1 && token[token.Length - 1] != '.';
        }

        #endregion
    }
}
