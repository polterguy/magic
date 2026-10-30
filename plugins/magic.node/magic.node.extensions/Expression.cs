/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using System.Threading;
using System.Collections.Generic;
using System.Collections.Concurrent;
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
        ///
        /// Notice, internal, since an expression should be created with Create, which shares the expression
        /// created for a string with whoever asks for the same string next.
        /// </summary>
        /// <param name="expression">String representation of expression to create.</param>
        internal Expression(string expression)
        {
            _iterators = Parse(expression);
        }

        #region [ -- Sharing expressions created from the same string -- ]

        /*
         * The expressions created recently, by the string they were created from, in two generations; the current one, and the
         * one before it. A string found in the old generation is moved to the current one, and when the current one is full it
         * becomes the old one, and the old one is dropped. The cache never holds more than twice the maximum, whatever the
         * strings are, and a string used now and then stays in it.
         */
        sealed class Generations
        {
            public readonly ConcurrentDictionary<string, Expression> Current = new();
            public readonly ConcurrentDictionary<string, Expression> Previous;
            public int Count;

            public Generations(ConcurrentDictionary<string, Expression> previous)
            {
                Previous = previous;
            }
        }

        const int MaxCachedExpressions = 4096;
        const int MaxCachedLength = 256;
        static readonly object _rotation = new();
        static volatile Generations _generations = new(new());

        /// <summary>
        /// Returns an expression for the specified string, which is the very same instance as the one a previous call
        /// returned for the same string, if that was not too long ago.
        ///
        /// Useful for strings you evaluate over and over, or that show up in many places, since an expression cannot be changed
        /// once it is created, and sharing it saves both parsing the string again and keeping a copy of the result.
        /// Notice, a string that is not a valid expression throws every time, and is never remembered.
        /// </summary>
        /// <param name="expression">String representation of the expression.</param>
        /// <returns>An expression equal to the one new Expression(expression) would create.</returns>
        public static Expression Create(string expression)
        {
            if (expression == null || expression.Length > MaxCachedLength)
                return new Expression(expression);

            var generations = _generations;
            if (generations.Current.TryGetValue(expression, out var result))
                return result;

            if (generations.Previous.TryGetValue(expression, out result))
            {
                Remember(generations, expression, result);
                return result;
            }

            result = new Expression(expression);
            Remember(generations, expression, result);
            return result;
        }

        /// <summary>
        /// Creates a new expression from its string representation, which is never shared with anybody else, and never remembered.
        ///
        /// For strings that are not worth remembering, such as the ones built from the data of a request, which anybody
        /// could fill the cache with. Everything else should be created with Create.
        /// </summary>
        /// <param name="expression">String representation of expression to create.</param>
        /// <returns>A new expression.</returns>
        public static Expression CreateUncached(string expression)
        {
            return new Expression(expression);
        }

        /*
         * Forgets every expression created so far. Needed when something that decides what a string means has changed, which
         * is what registering an iterator does, since an iterator is resolved when it is created.
         */
        internal static void ClearCache()
        {
            lock (_rotation)
            {
                _generations = new(new());
            }
        }

        static void Remember(Generations generations, string key, Expression value)
        {
            // Notice, always the generations the caller started out with, so something created before a clear can never end up in the new ones.
            if (generations.Current.TryAdd(key, value) && Interlocked.Increment(ref generations.Count) > MaxCachedExpressions)
            {
                lock (_rotation)
                {
                    if (ReferenceEquals(_generations, generations))
                        _generations = new(generations.Current);
                }
            }
        }

        #endregion

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
                    if (x.Value.Contains('/'))
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
            var last = _iterators.Count - 1;
            for (var idx = 0; idx <= last; idx++)
            {
                result = _iterators[idx].Evaluate(identity, result);

                /*
                 * Short circuiting when a step yields nothing. Only needed after the last iterator, and in front of one that is
                 * not a pure function of its input, since the pure ones yield nothing when given nothing - and since every check
                 * walks the whole chain of iterators so far, checking after every step makes the cost grow with the square of the
                 * number of iterators.
                 */
                if ((idx == last || !_iterators[idx + 1].IsInputPure) && !result.Any())
                    return [];
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
                    UnwrapNode(idx, ex, applyLists);
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
         * Forward evaluates the expression in the specified node.
         */
        static void UnwrapNode(Node idx, Expression ex, bool applyLists)
        {
            if (applyLists && idx.Name == "node_reference")
            {
                idx.Value = idx.Evaluate()?.SingleOrDefault();
                return;
            }

            if (applyLists && ex._iterators[^1].Value == "*")
            {
                var all = idx.Evaluate();
                idx.AddRange(all.Select(x => x.Clone()));
                idx.Value = null;
                return;
            }

            // Evaluating once, since the result is lazy, and every Count and FirstOrDefault would walk the expression again.
            var res = idx.Evaluate().ToList();
            if (res.Count > 1)
            {
                if (applyLists)
                    idx.AddRange(res.Select(x => x.Clone()));
                else
                    throw new HyperlambdaException("Multiple sources found for unwrap invocation");
            }

            idx.Value = res.FirstOrDefault()?.Value;
        }

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

            var position = StartOf(expression);
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
                else if (idx == '{' && ExtrapolationPrefix(expression, segment, quoted, contentLength) is { } prefix)
                {
                    // Extrapolated expression allowing for nesting expressions.
                    result.Add(new Iterator(prefix + ReadExtrapolatedExpression(expression, ref position)));
                    quoted = null;

                    // Making sure we don't return remnants further down.
                    if (position >= length)
                        return result;

                    // Discarding end of iterator character to prepare for next iterator's value.
                    position = SkipSeparator(expression, position);
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

        // The expression used to be read through a stream reader, which discards a BOM.
        static int StartOf(string expression)
        {
            return expression.Length > 0 && expression[0] == '\uFEFF' ? 1 : 0;
        }

        // Moves past the "/" ending an iterator, if that is what the position is at.
        static int SkipSeparator(string expression, int position)
        {
            return expression[position] == '/' ? position + 1 : position;
        }

        /*
         * Returns the prefix of an iterator starting an extrapolated expression at the current position, which
         * is empty for "{...}" and "=" for "={...}", or null if the iterator already has other content.
         */
        static string ExtrapolationPrefix(string expression, int segment, StringBuilder quoted, int contentLength)
        {
            if (contentLength == 0)
                return "";
            if (contentLength == 1 && (quoted != null && quoted.Length == 1 ? quoted[0] : expression[segment]) == '=')
                return "=";
            return null;
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
