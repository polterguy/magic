/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
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
            _iterators = new List<Iterator>(Parse(expression));
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
         */
        IEnumerable<Iterator> Parse(string expression)
        {
            var builder = new StringBuilder();
            using (var reader = new StreamReader(new MemoryStream(Encoding.UTF8.GetBytes(expression))))
            {
                while (!reader.EndOfStream)
                {
                    var idx = (char)reader.Peek();
                    if (idx == '/')
                    {
                        yield return new Iterator(builder.ToString());
                        builder.Clear();
                        reader.Read(); // Discarding the '/' character at stream's head.
                    }
                    else if (idx == '"' && builder.Length == 0)
                    {
                        // Single quoted string, allows for having iterators containing "/" in their values.
                        builder.Append(ParserHelper.ReadQuotedString(reader));
                    }
                    else if (idx == '{' && builder.Length == 0)
                    {
                        // Extrapolated expression allowing for nesting expressions.
                        yield return new Iterator(ParseExtrapolatedExpression(reader, expression));

                        // Making sure we don't return remnants in builder further down
                        if (reader.EndOfStream)
                            yield break;

                        if ('/' == (char)reader.Peek())
                            reader.Read(); // Discarding end of iterator character to prepare for next iterator's value.
                    }
                    else if (idx == '{' && builder.Length == 1 && builder.ToString() == "=")
                    {
                        // Extrapolated expression allowing for nesting expressions.
                        yield return new Iterator("=" + ParseExtrapolatedExpression(reader, expression));
                        builder.Clear();

                        // Making sure we don't return remnants in builder further down
                        if (reader.EndOfStream)
                            yield break;

                        if ('/' == (char)reader.Peek())
                            reader.Read(); // Discarding end of iterator character to prepare for next iterator's value.
                    }
                    else
                    {
                        builder.Append(idx);
                        reader.Read(); // Discarding whatever we stuffed into our builder just now.
                    }
                }
            }

            yield return new Iterator(builder.ToString());
        }

        /*
         * Parses an extrapolated/nested expression.
         */
        string ParseExtrapolatedExpression(StreamReader reader, string expression)
        {
            // Buffer used to hold nested expression.
            var builder = new StringBuilder();

            // Needed to count "levels" of nexted expressions, for cases where a nested expression contains another nested expression.
            var no = 0;

            // Reading until we reach EOF or have fetched entire nested expression.
            do
            {
                // Reading next character, sanity checking, and appending to builder.
                if (reader.EndOfStream)
                    throw new HyperlambdaException($"Extrapolated expression was never closed in expression '{expression}'");

                // Reading next character and appending to builder.
                var idx = (char)reader.Read();
                builder.Append(idx);

                // Supporting multiple levels of extrapolated expressions.
                if (idx == '{')
                    no += 1;
                else if (idx == '}')
                    no -= 1;

            } while (no != 0); // Ensuring we don't quit before we're at "level 0" again ...

            // Done, returning nexted expression.
            return builder.ToString();
        }

        #endregion
    }
}
