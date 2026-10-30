/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;

namespace magic.node.extensions
{
    /// <summary>
    /// A single iterator component for an expression.
    /// </summary>
    public class Iterator
    {
        readonly Func<Node, IEnumerable<Node>, IEnumerable<Node>> _evaluate;

        /*
         * Dictionary containing lookups for non-parametrized iterators, implying an iterator that
         * doesn't require arguments, but becomes an exact match for the iterator evaluator. Such
         * as e.g. "..", "*", etc.
         */
        static readonly Dictionary<string, Func<Node, IEnumerable<Node>, IEnumerable<Node>>> _nonParametrizedIterators = new()
        {
            {"*", (identity, input) => input.SelectMany(x => x.Children)},
            {"#", (identity, input) => input.Select(x => x.Value as Node)},
            {"-", (identity, input) => input.Select(x => x.Previous ?? x.Parent.Children.Last())},
            {"+", (identity, input) => input.Select(x => x.Next ?? x.Parent.Children.First())},
            {".", (identity, input) => input.Select(x => x.Parent).Distinct()},
            {"**", (identity, input) => AllDescendants(input)},
            {"--", (identity, input) => AllAncestors(input)},
            {"..", (identity, input) => {

                /*
                 * Notice, input might be a "no sequence enumerable",
                 * in case previous iterator yielded no results,
                 * so we'll have to accommodate for such cases.
                 */
                var idx = input.FirstOrDefault();
                if (idx == null)
                    return [];

                while (idx.Parent != null)
                    idx = idx.Parent;

                return [idx];
            }},
        };

        /*
         * Dictionary containing lookups for first character of parametrized iterator, resolving
         * to functor returning functor responsible for executing parametrized iterator.
         *
         * A parametrized iterator, is an iterator that somehow requires parameters,
         * such as arguments, declaring input arguments to the iterator.
         *
         * E.g. [0,1] is a parametrized iterator.
         */
        static readonly Dictionary<char, Func<string, Func<Node, IEnumerable<Node>, IEnumerable<Node>>>> _parametrizedIterators = new()
        {
            /*
             * Value iterator, comparing the value of the iterator, with the
             * value of the node, converting to string before doing comparison,
             * if necessary.
             */
            {'=', (value) => {
                var name = value.Substring(1);
                if (name.StartsWith('{') && name.EndsWith('}'))
                    return Extrapolated(value, true);
                return (identity, input) => ValueEqualsIterator(
                    input,
                    name);
            }},

            /*
             * Subscript iterator, returning from [n1..n2] from its previous result set.
             * Alternatively you can supply a pipe separated list of names, such as e.g. [foo|bar].
             */
            {'[', (value) => {
                if (value.Contains('|'))
                {
                    var names = value.Substring(1, value.Length - 2).Split(new char[] { '|' }, StringSplitOptions.RemoveEmptyEntries);
                    return (identity, input) => SubscriptIterator(
                        input,
                        names);
                }
                else
                {
                    var ints = value.Substring(1, value.Length - 2).Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                    var start = int.Parse(ints[0]);
                    var count = int.Parse(ints[1]);
                    return (identity, input) => SubscriptIterator(
                        input,
                        start,
                        count);
                }
            }},

            /*
             * Extrapolated expression iterator, evaluating nested expression, returning value of node
             * expression is referencing, assuming there is only one node matching expression.
             */
            {'{', (value) => {
                return Extrapolated(value, false);
            }},

            /*
             * Name equality iterator, returning the first node matching the specified name,
             * upwards in hierarchy, implying direct ancestors, and older sibling nodes,
             * and older siblings of direct ancestors.
             */
            {'@', (value) => {
                var name = value.Substring(1);
                return (identity, input) => AncestorNameIterator(input, name);
            }},

            /*
             * Ancestor iterator looking upwards in hierarchy for first direct ancestor node
             * matching the specified name.
             */
            {'^', (value) => {
                var name = value.Substring(1);
                return (identity, input) => AncestorNameIterator(input, name, false);
            }},

            /*
             * Ancestor iterator looking upwards in hierarchy for first direct ancestor node
             * matching the specified name.
             */
            {'!', (value) => {
                var name = value.Substring(1);
                return (identity, input) => AllDescendants(input, name);
            }},
        };

        /*
         * The built-in iterators as they were declared above, such that we can tell them apart from
         * iterators somebody replaced or added later, which can do anything with their input.
         */
        static readonly Dictionary<string, Func<Node, IEnumerable<Node>, IEnumerable<Node>>> _builtInNonParametrizedIterators = new(_nonParametrizedIterators);
        static readonly Dictionary<char, Func<string, Func<Node, IEnumerable<Node>, IEnumerable<Node>>>> _builtInParametrizedIterators = new(_parametrizedIterators);

        /*
         * Creates an iterator from its given string representation.
         */
        internal Iterator(string value)
        {
            Value = value;
            _evaluate = CreateEvaluator(Value);
            IsInputPure = CalculateIsInputPure(Value);
        }

        /*
         * True if the iterator is a pure function of the nodes it is given; it yields nothing when it is given nothing,
         * and does no work until its result is enumerated. All the built-in iterators are, except the extrapolated ones,
         * which evaluate a nested expression as soon as they are created.
         *
         * Notice, Expression.Evaluate only needs to look for an empty result in front of an iterator that is not.
         */
        internal bool IsInputPure { get; }

        /// <summary>
        /// Returns the string representation of the iterator.
        /// </summary>
        public string Value { get; private set; }

        /// <summary>
        /// Evaluates the iterator from the given identity node, with the given input,
        /// resulting in a new node set being returned by the evaluation.
        /// </summary>
        /// <param name="identity">Identity node from which the original expression was evaluated from.</param>
        /// <param name="input">A collection of nodes passed in from the result of the evaluation of the previous iterator.</param>
        /// <returns>An enumerable collection of Nodes, from the result of evaluating the iterator.</returns>
        public IEnumerable<Node> Evaluate(Node identity, IEnumerable<Node> input)
        {
            return _evaluate(identity, input);
        }

        /// <summary>
        /// Allows you to inject a non-parametrized iterator into the available
        /// iterators.
        /// </summary>
        /// <param name="iteratorValue">Fully qualified name, to match your functor.</param>
        /// <param name="functor">Functor to execute as your iterator name is matched.</param>
        public static void AddStaticIterator(
            string iteratorValue,
            Func<Node, IEnumerable<Node>, IEnumerable<Node>> functor)
        {
            _nonParametrizedIterators[iteratorValue] = functor;
            Expression.ClearCache(); // An iterator is resolved when it is created, so expressions created earlier have to go.
        }

        /// <summary>
        /// Allows you to add a parametrized iterator into the available
        /// iterators.
        /// </summary>
        /// <param name="iteratorFirstCharacter">First character your iterator must start with.</param>
        /// <param name="createFunctor">Function that is responsible for creating your actual iterator.</param>
        public static void AddDynamicIterator(
            char iteratorFirstCharacter,
            Func<string, Func<Node, IEnumerable<Node>, IEnumerable<Node>>> createFunctor)
        {
            _parametrizedIterators[iteratorFirstCharacter] = createFunctor;
            Expression.ClearCache(); // An iterator is resolved when it is created, so expressions created earlier have to go.
        }

        #region [ -- Overrides -- ]

        /// <summary>
        /// Returns a string representation of your Iterator.
        /// </summary>
        /// <returns>A string representation of your iterator.</returns>
        public override string ToString()
        {
            return Value;
        }

        /// <summary>
        /// Returns the hash code for your instance.
        /// </summary>
        /// <returns>Hash code, useful for for instance creating keys for dictionaries, etc.</returns>
        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        /// <summary>
        /// Comparison method, comparing the current instance to some other instance.
        /// </summary>
        /// <param name="obj">Right hand side to compare instance with.</param>
        /// <returns>True if instances are logically similar.</returns>
        public override bool Equals(object obj)
        {
            if (obj is not Iterator it)
                return false;

            return Value.Equals(it.Value);
        }

        #endregion

        #region [ -- Private helper methods -- ]

        /*
         * Creates the evaluator, which is simply a function, taking an identity node, an enumerable of
         * nodes, resuolting in a new enumerable of nodes.
         */
        static Func<Node, IEnumerable<Node>, IEnumerable<Node>> CreateEvaluator(string iteratorValue)
        {
            // If iterator is escaped, we assume it's a name lookup.
            if (iteratorValue.StartsWith('\\'))
            {
                var name = iteratorValue.Substring(1);
                return (identity, input) => input.Where(x => x.Name == name);
            }

            /*
             * First checking non-parametrized iterators for a match of entire string.
             */
            if (_nonParametrizedIterators.TryGetValue(iteratorValue, out var value))
                return value;

            /*
             * Only if there are no non-parametrized iterators matches, we resort
             * to looking into parametrized iterators for a match, but only if iterator
             * value is not empty string.
             */
            if (iteratorValue.Length != 0)
            {
                /*
                 * Checking parametrized iterators for a match.
                 */
                var firstCharacter = iteratorValue.First();
                if (_parametrizedIterators.TryGetValue(firstCharacter, out var value2))
                    return value2(iteratorValue);

                /*
                 * Checking if this is an "n'th child iterator", which is true if
                 * its content can be successfully converted into an integer.
                 */
                if (int.TryParse(iteratorValue, out int number))
                    return (identity, input) => input.SelectMany(x => x.Children.Skip(number).Take(1));
            }

            /*
             * Defaulting to name lookup iterator.
             *
             * This is the default iterator, doing a basic name lookup, and the iterator
             * used if none of the above results in any match.
             */
            return (identity, input) => input.Where(x => x.Name == iteratorValue);
        }

        /*
         * Mirrors the way CreateEvaluator resolves an iterator, answering whether it is one of the pure built-in ones.
         * Notice, when in doubt this returns false, which only costs Expression.Evaluate an extra check.
         */
        static bool CalculateIsInputPure(string iteratorValue)
        {
            if (iteratorValue.StartsWith('\\'))
                return true; // Name lookup.

            if (_nonParametrizedIterators.TryGetValue(iteratorValue, out var value))
                return _builtInNonParametrizedIterators.TryGetValue(iteratorValue, out var original) && ReferenceEquals(value, original);

            if (iteratorValue.Length != 0)
            {
                var firstCharacter = iteratorValue[0];
                if (_parametrizedIterators.TryGetValue(firstCharacter, out var factory))
                {
                    if (!_builtInParametrizedIterators.TryGetValue(firstCharacter, out var originalFactory) || !ReferenceEquals(factory, originalFactory))
                        return false;

                    switch (firstCharacter)
                    {
                        case '[':
                        case '@':
                        case '^':
                        case '!':
                            return true;

                        case '=':
                            return !iteratorValue.Contains('{'); // Only the extrapolated variant evaluates a nested expression.

                        default:
                            return false; // '{', the extrapolated expression iterator.
                    }
                }

                if (int.TryParse(iteratorValue, out _))
                    return true; // n'th child iterator.
            }

            return true; // Name lookup iterator.
        }

        /*
         * Helper method to return all descendants recursively for the '**' iterator.
         */
        static IEnumerable<Node> AllDescendants(IEnumerable<Node> input)
        {
            foreach (var idx in input)
            {
                yield return idx;
                foreach (var idxInner in AllDescendants(idx.Children))
                {
                    yield return idxInner;
                }
            }
        }

        /*
         * Helper method to return all ancestors recursively for the '--' iterator.
         */
        static IEnumerable<Node> AllAncestors(IEnumerable<Node> input)
        {
            foreach (var idx in input)
            {
                var cur = idx;
                while (cur != null)
                {
                    while (cur.Previous != null)
                    {
                        cur = cur.Previous;
                        yield return cur;
                    }
                    cur = cur.Parent;
                    if (cur != null)
                        yield return cur;
                }
            }
        }

        /*
         * Helper method to return all descendants recursively for the '!' iterator.
         */
        static IEnumerable<Node> AllDescendants(IEnumerable<Node> input, string exceptName)
        {
            foreach (var idx in input)
            {
                if (idx.Name != exceptName)
                {
                    yield return idx;
                    foreach (var idxInner in AllDescendants(idx.Children, exceptName))
                    {
                        yield return idxInner;
                    }
                }
            }
        }

        /*
         * Name equality iterator, requiring a statically declared name, returning
         * results of all nodes from previous result set, matching name specified.
         */
        static IEnumerable<Node> ValueEqualsIterator(
            IEnumerable<Node> input,
            string name)
        {
            return input.Where(x => {
                if (x.Value == null)
                    return name.Length == 0; // In case we're looking for null values

                if (x.Value is string)
                    return name.Equals(x.Value);

                return name.Equals(Converter.ToString(x.Value).Item2);
            });
        }

        /*
         * Subscript iterator, returning a subscript of the previous result set.
         */
        static IEnumerable<Node> SubscriptIterator(
            IEnumerable<Node> input,
            int start,
            int count)
        {
            return input.Skip(start).Take(count);
        }

        /*
         * Subscript iterator overload, taking a list of names.
         */
        static IEnumerable<Node> SubscriptIterator(
            IEnumerable<Node> input,
            string[] names)
        {
            foreach (var idx in input)
            {
                if (names.Contains(idx.Name))
                    yield return idx;
            }
        }

        /*
         * Extrapolated iterator, returning result of nested expression.
         */
        static Func<Node, IEnumerable<Node>, IEnumerable<Node>> Extrapolated(string expression, bool value)
        {
            /*
             * The nested expression is created the first time the iterator is evaluated, and not before, such that one that is
             * not valid throws when it is evaluated, as it always did, and then it is created no more. It is evaluated every
             * time, since what it yields depends on the nodes it is evaluated from, and not on the expression.
             */
            Expression nested = null;
            return (identity, input) =>
            {
                nested ??= Expression.Create(expression.Substring(value ? 2 : 1, expression.Length - (value ? 3 : 2)));
                return ExtrapolatedExpressionIterator(identity, input, expression, nested, value);
            };
        }

        static IEnumerable<Node> ExtrapolatedExpressionIterator(
            Node identity,
            IEnumerable<Node> input,
            string expression,
            Expression x,
            bool value = false)
        {
            var result = x.Evaluate(identity);
            if (result.Count() > 1)
               throw new HyperlambdaException($"Extrapolated expression '{expression}' yields multiple results");
            if (value)
            {
                var strValue = result.FirstOrDefault()?.GetEx<string>();
                return input.Where(y => y.GetEx<string>() == strValue);
            }
            var name = result.FirstOrDefault()?.GetEx<string>();
            return input.Where(y => y.Name == name);
        }

        /*
         * Ancestor/elder-sibling iterator, returning the first node being either
         * a direct ancestor, or an older sibling (of self or direct ancestors),
         * matching the specified name.
         */
        static IEnumerable<Node> AncestorNameIterator(
            IEnumerable<Node> input,
            string name,
            bool siblings = true)
        {
            if (siblings)
            {
                var cur = input.FirstOrDefault()?.FindElderOrAncestor(name);
                if (cur == null)
                    return [];

                return [cur];
            }
            else
            {
                var cur = input.FirstOrDefault()?.Parent;
                while (cur != null && cur.Name != name)
                {
                    cur = cur.Parent;
                }

                if (cur == null)
                    return [];

                return [cur];
            }
        }

        #endregion
    }
}
