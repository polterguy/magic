/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using magic.node.extensions.hyperlambda.internals;

namespace magic.node.extensions
{
    /// <summary>
    /// Expression class for creating lambda expressions, referencing nodes in your Node lambda objects.
    /// </summary>
    public class Expression
    {
        readonly List<Iterator> _iterators;

        /// <summary>
        /// Creates a new expression from its string representation.
        /// </summary>
        /// <param name="expression">String representation of expression to create.</param>
        public Expression(string expression)
        {
            _iterators = Parse(expression);
        }

        /// <summary>
        /// Returns the string representation of your expression.
        /// </summary>
        public string Value
        {
            get
            {
                return string.Join("/", _iterators.Select(x =>
                {
                    // Checking if we need to quote iterator.
                    if (x.Value.Contains("/"))
                        return "\"" + x.Value + "\"";
                    return x.Value;
                }));
            }
        }

        /// <summary>
        /// Convenience method in case you want to access iterators individually.
        /// </summary>
        public IEnumerable<Iterator> Iterators { get { return _iterators; } }

        /// <summary>
        /// Evaluates your expression from the given identity node.
        /// </summary>
        /// <param name="identity">Identity node from which your expression is evaluated.</param>
        /// <returns>The result of the evaluation.</returns>
        public IEnumerable<Node> Evaluate(Node identity)
        {
            /*
             * Evaluating all iterators sequentially, returning the results to caller,
             * starting from the identity node.
             */
            IEnumerable<Node> result = [identity];
            foreach (var idx in _iterators)
            {
                result = idx.Evaluate(identity, result);
                if (!result.Any())
                    return []; // Short circuiting to slightly optimize invocation.
            }
            return result;
        }

        /// <summary>
        /// Forward evaluates all expressions found in nodes' descendants.
        /// </summary>
        /// <param name="nodes">Nodes who's descendants we should forward evaluate.</param>
        /// <param name="applyLists">If true this will unwrap lists.</param>
        public static void Unwrap(IEnumerable<Node> nodes, bool applyLists = false)
        {
            foreach (var idx in nodes)
            {
                if (idx.Value is Expression ex)
                {
                    if (applyLists && idx.Name == "node_reference")
                    {
                        idx.Value = idx.Evaluate()?.SingleOrDefault();
                    }
                    else
                    {
                        if (applyLists && ex._iterators.Last().Value == "*")
                        {
                            var res = idx.Evaluate();
                            idx.AddRange(res.Select(x => x.Clone()));
                            idx.Value = null;
                        }
                        else
                        {
                            var res = idx.Evaluate();
                            if (res.Count() > 1)
                            {
                                if (applyLists)
                                    idx.AddRange(res.Select(x => x.Clone()));
                                else
                                    throw new HyperlambdaException("Multiple sources found for unwrap invocation");
                            }

                            idx.Value = res.FirstOrDefault()?.Value;
                        }
                    }
                }
            }
        }

        #region [ -- Overrides -- ]

        /// <inheritdoc />
        public override string ToString()
        {
            return Value;
        }

        /// <inheritdoc />
        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        /// <inheritdoc />
        public override bool Equals(object obj)
        {
            if (!(obj is Expression ex))
                return false;

            return Value.Equals(ex.Value);
        }

        #endregion

        #region [ -- Private helper methods -- ]

        /*
         * Parses your expression resulting in a chain of iterators.
         *
         * Walks the text by index, only allocating a builder for iterators containing a quoted string.
         * The text of the iterator currently being read is the content of [quoted], if any, followed by
         * everything from [segment] up to the current position.
         */
        static List<Iterator> Parse(string expression)
        {
            var result = new List<Iterator>();
            var length = expression.Length;

            // The expression used to be read through a stream reader, which discards a BOM.
            var position = length > 0 && expression[0] == '\uFEFF' ? 1 : 0;
            var segment = position;
            StringBuilder quoted = null;
            while (position < length)
            {
                var idx = expression[position];
                var contentLength = (quoted?.Length ?? 0) + (position - segment);
                if (idx == '/')
                {
                    result.Add(new Iterator(Content(expression, segment, position, quoted)));
                    quoted = null;
                    segment = ++position; // Discarding the '/' character.
                }
                else if (idx == '"' && contentLength == 0)
                {
                    // Single quoted string, allows for having iterators containing "/" in their values.
                    quoted ??= new StringBuilder();
                    quoted.Append(ReadQuotedString(expression, ref position));
                    segment = position;
                }
                else if (idx == '{' && contentLength == 0)
                {
                    // Extrapolated expression allowing for nesting expressions.
                    result.Add(new Iterator(ReadExtrapolatedExpression(expression, ref position)));
                    quoted = null;

                    // Making sure we don't return remnants further down.
                    if (position >= length)
                        return result;

                    if (expression[position] == '/')
                        position++; // Discarding end of iterator character to prepare for next iterator's value.
                    segment = position;
                }
                else if (idx == '{' && contentLength == 1 && (quoted != null && quoted.Length == 1 ? quoted[0] : expression[segment]) == '=')
                {
                    // Extrapolated expression allowing for nesting expressions.
                    result.Add(new Iterator("=" + ReadExtrapolatedExpression(expression, ref position)));
                    quoted = null;

                    // Making sure we don't return remnants further down.
                    if (position >= length)
                        return result;

                    if (expression[position] == '/')
                        position++; // Discarding end of iterator character to prepare for next iterator's value.
                    segment = position;
                }
                else
                {
                    position++;
                }
            }
            result.Add(new Iterator(Content(expression, segment, position, quoted)));
            return result;
        }

        /*
         * Returns the content of the iterator currently being read.
         */
        static string Content(string expression, int segment, int position, StringBuilder quoted)
        {
            if (quoted == null)
                return expression.Substring(segment, position - segment);
            return quoted.Append(expression, segment, position - segment).ToString();
        }

        /*
         * Reads a quoted string, starting at the opening '"' character, and leaves position after the closing one.
         */
        static string ReadQuotedString(string expression, ref int position)
        {
            var start = position + 1;
            var idx = expression.AsSpan(start).IndexOfAny('"', '\\');
            if (idx < 0)
                throw new HyperlambdaException("Syntax error, string literal not closed before end of input");
            idx += start;
            if (expression[idx] == '"')
            {
                position = idx + 1;
                return expression.Substring(start, idx - start);
            }

            // String literal contains escape characters.
            var builder = new StringBuilder();
            builder.Append(expression, start, idx - start);
            position = idx;
            while (position < expression.Length)
            {
                var c = expression[position++];
                if (c == '"')
                    return builder.ToString();
                if (c == '\\')
                    builder.Append(ParserHelper.GetEscapeCharacter(position < expression.Length ? expression[position++] : -1, '"'));
                else
                    builder.Append(c);
            }
            throw new HyperlambdaException("Syntax error, string literal not closed before end of input");
        }

        /*
         * Reads an extrapolated/nested expression, starting at its opening '{' character, and leaves position
         * after its closing '}' character. Supports multiple levels of extrapolated expressions.
         */
        static string ReadExtrapolatedExpression(string expression, ref int position)
        {
            var start = position;
            var level = 0;
            do
            {
                if (position >= expression.Length)
                    throw new HyperlambdaException($"Extrapolated expression was never closed in expression '{expression}'");

                var idx = expression[position++];
                if (idx == '{')
                    level += 1;
                else if (idx == '}')
                    level -= 1;
            } while (level != 0);
            return expression.Substring(start, position - start);
        }

        #endregion
    }
}
