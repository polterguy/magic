/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Globalization;
using System.Collections.Generic;
using magic.utils;

namespace magic.node
{
    public class Expression
    {
        public class Iterator
        {
            readonly Func<Node, IEnumerable<Node>, IEnumerable<Node>> _evaluate;

            public Iterator(string value)
            {
                Value = value;
                _evaluate = CreateEvaluator(Value);
            }

            public string Value { get; private set; }

            public IEnumerable<Node> Evaluate(Node identity, IEnumerable<Node> input)
            {
                return _evaluate(identity, input);
            }

            #region [ -- Overrides -- ]

            public override string ToString()
            {
                return Value;
            }

            public override int GetHashCode()
            {
                return Value.GetHashCode();
            }

            public override bool Equals(object obj)
            {
                return Value.Equals(obj);
            }

            #endregion

            #region [ -- Private helper methods -- ]

            Func<Node, IEnumerable<Node>, IEnumerable<Node>> CreateEvaluator(string value)
            {
                switch (value)
                {
                    case "*":
                        return (identiy, input) => input.SelectMany(x => x.Children);

                    case "#":
                        return (identiy, input) => input.Select(x => x.Get<Node>());

                    case "-":
                        return (identiy, input) => input.Select(x => x.Previous ?? x.Parent.Children.Last());

                    case "+":
                        return (identiy, input) => input.Select(x => x.Next ?? x.Parent.Children.First());

                    case ".":
                        return (identiy, input) => input.Select(x => x.Parent).Distinct();

                    case "..":
                        return (identiy, input) =>
                        {
                            // Notice, input might be a "no sequence enumerable", so we'll have to accommodate for "null returns".
                            var idx = input.FirstOrDefault();

                            if (idx == null)
                                return new Node[] { };

                            while (idx.Parent != null)
                                idx = idx.Parent;

                            return new Node[] { idx };
                        };

                    case "**":
                        return (identiy, input) =>
                        {
                            return AllDescendants(input);
                        };

                    default:

                        if (value.StartsWith("\\", StringComparison.InvariantCulture))
                        {
                            var lookup = value.Substring(1);
                            return (identiy, input) => input.Where(x => x.Name == value);
                        }

                        if (value.StartsWith("{", StringComparison.InvariantCulture) &&
                            value.EndsWith("}", StringComparison.InvariantCulture))
                        {
                            var index = int.Parse(value.Substring(1, value.Length - 2));
                            return (identity, input) => input.Where(x => x.Name == identity.Children.Skip(index).First().Get<string>());
                        }

                        if (value.StartsWith("=", StringComparison.InvariantCulture))
                        {
                            var lookup = value.Substring(1);
                            return (identiy, input) => input.Where(x =>
                            {
                                var val = x.Value;
                                if (val == null)
                                    return lookup.Length == 0; // In case we're looking for null values

                                if (val is string)
                                    return lookup.Equals(val);

                                return lookup.Equals(Convert.ToString(val, CultureInfo.InvariantCulture));
                            });
                        }

                        if (value.StartsWith("[", StringComparison.InvariantCulture) &&
                            value.EndsWith("]", StringComparison.InvariantCulture))
                        {
                            var ints = value.Substring(1, value.Length - 2).Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                            var start = int.Parse(ints[0]);
                            var count = int.Parse(ints[1]);
                            return (identiy, input) => input.Skip(start).Take(count);
                        }

                        if (value.StartsWith("@", StringComparison.InvariantCulture))
                        {
                            var lookup = value.Substring(1);
                            return (identiy, input) =>
                            {
                                var cur = input.FirstOrDefault()?.Previous ?? input.FirstOrDefault()?.Parent;
                                while (cur != null && cur.Name != lookup)
                                {
                                    var previous = cur.Previous;
                                    if (previous == null)
                                        cur = cur.Parent;
                                    else
                                        cur = previous;
                                }

                                if (cur == null)
                                    return new Node[] { };

                                return new Node[] { cur };
                            };
                        }

                        if (int.TryParse(value, out int number))
                            return (identiy, input) => input.SelectMany(x => x.Children.Skip(number).Take(1));

                        return (identiy, input) => input.Where(x => x.Name == value);
                }
            }

            IEnumerable<Node> AllDescendants(IEnumerable<Node> input)
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

            #endregion
        }

        readonly List<Iterator> _iterators;

        public Expression(string expression)
        {
            Value = expression;
            _iterators = new List<Iterator>(Parse(expression));
        }

        public string Value { get; private set; }

        public IEnumerable<Iterator> Iterators { get { return _iterators; } }

        public IEnumerable<Node> Evaluate(Node identity)
        {
            IEnumerable<Node> result = new Node[] { identity };
            foreach (var idx in _iterators)
            {
                result = idx.Evaluate(identity, result);
                if (!result.Any())
                    return new Node[] { }; // Short circuiting to slightly optimize invocation.
            }
            return result;
        }

        #region [ -- Overrides -- ]

        public override string ToString()
        {
            return Value;
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public override bool Equals(object obj)
        {
            return Value.Equals(obj);
        }

        #endregion

        #region [ -- Private helper methods -- ]

        IEnumerable<Iterator> Parse(string expression)
        {
            var builder = new StringBuilder();

            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(expression)))
            {
                using (var reader = new StreamReader(stream))
                {
                    while (!reader.EndOfStream)
                    {
                        var idx = (char)reader.Read();
                        if (idx == -1)
                            break;

                        if (idx == '/')
                        {
                            yield return new Iterator(builder.ToString());
                            builder.Clear();
                        }
                        else if (idx == '"' && builder.Length == 0)
                        {
                            // String literal iterator.
                            yield return new Iterator(StringLiteralParser.ReadQuotedString(reader));
                        }
                        else
                        {
                            builder.Append(idx);
                        }
                    }
                }
            }

            if (builder.Length == 0)
                throw new ApplicationException("Syntax error at end of expression");

            yield return new Iterator(builder.ToString());
        }

        #endregion
    }
}
