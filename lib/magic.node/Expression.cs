/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;

namespace magic.node
{
    public class Expression
    {
        public class Iterator
        {
            readonly Func<IEnumerable<Node>, IEnumerable<Node>> _evaluate;

            public Iterator(string value)
            {
                Value = value;
                _evaluate = CreateEvaluator(Value);
            }

            public string Value { get; private set; }

            public IEnumerable<Node> Evaluate(IEnumerable<Node> input)
            {
                return _evaluate(input);
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

            Func<IEnumerable<Node>, IEnumerable<Node>> CreateEvaluator(string value)
            {
                switch (value)
                {
                    case "*":
                        return (input) => input.SelectMany((x) => x.Children);

                    case "-":
                        return (input) => input.Select((x) => x.Previous ?? x.Parent.Children.Last());

                    case "+":
                        return (input) => input.Select((x) => x.Next ?? x.Parent.Children.First());

                    case "$":
                        return (input) => input.Distinct();

                    case ".":
                        return (input) => input.Select((x) => x.Parent);

                    case "..":
                        return (input) =>
                        {
                            var idx = input.FirstOrDefault();
                            while (idx != null && idx.Parent != null)
                                idx = idx.Parent;
                            if (idx == null)
                                return new Node[] { };
                            return new Node[] { idx };
                        };

                    default:
                        if (value.StartsWith("=", StringComparison.InvariantCulture))
                        {
                            var lookup = value.Substring(1);
                            return (input) => input.Where((x) => x.Get<string>() == lookup);
                        }

                        if (value.StartsWith("@", StringComparison.InvariantCulture))
                        {
                            var lookup = value.Substring(1);
                            return (input) =>
                            {
                                var cur = input.FirstOrDefault()?.Previous;
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
                            return (input) => input.SelectMany((x) => x.Children.Skip(number).Take(1));

                        return (input) => input.Where((x) => x.Name == value);
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

        public IEnumerable<Node> Evaluate(IEnumerable<Node> input)
        {
            foreach (var idx in _iterators)
            {
                input = idx.Evaluate(input);
                if (!input.Any())
                    return new Node[] { }; // Short circuiting to slightly optimize invocation.
            }
            return input;
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
