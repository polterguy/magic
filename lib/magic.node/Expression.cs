/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Text;
using System.Linq;
using System.Collections.Generic;

namespace magic.node
{
    public class Expression
    {
        public class Iterator
        {
            Func<IEnumerable<Node>, IEnumerable<Node>> _evaluate;
            public string Value { get; private set; }

            public Iterator(string value)
            {
                Value = value;
                _evaluate = CreateEvaluator(Value);
            }

            public IEnumerable<Node> Evaluate(IEnumerable<Node> input)
            {
                return _evaluate(input);
            }

            #region [ -- Private helper methods -- ]

            Func<IEnumerable<Node>, IEnumerable<Node>> CreateEvaluator(string value)
            {
                switch(value)
                {
                    case "*":
                        return (input) => input.SelectMany((x) => x.Children);
                    case "$":
                        return (input) => input.Distinct();
                    case ".":
                        return (input) => input.Select((x) => x.Parent);
                    case "..":
                        return (input) =>
                        {
                            var first = input.First();
                            while (first.Parent != null)
                                first = first.Parent;
                            return new Node[] { first };
                        };
                    default:
                        if (value.StartsWith("=", StringComparison.InvariantCulture))
                        {
                            var lookup = value.Substring(1);
                            return (input) => input.Where((x) => x.Get<string>() == lookup);
                        }
                        else
                        {
                            return (input) => input.Where((x) => x.Name == value);
                        }
                }
            }

            #endregion
        }

        readonly List<Iterator> _iterators;

        public Expression(string expression)
        {
            _iterators = new List<Iterator>(Parse(expression));
        }

        public IEnumerable<Iterator> Iterators { get { return _iterators; } }

        public IEnumerable<Node> Evaluate(IEnumerable<Node> input)
        {
            foreach (var idx in _iterators)
            {
                input = idx.Evaluate(input);
            }
            return input;
        }

        #region [ -- Internal helper methods -- ]

        IEnumerable<Iterator> Parse(string expression)
        {
            var en = expression.GetEnumerator();
            StringBuilder builder = new StringBuilder();
            while(en.MoveNext())
            {
                var idx = en.Current;
                if (idx == '/')
                {
                    yield return CreateIterator(builder.ToString());
                    builder.Clear();
                }
                else
                {
                    builder.Append(idx);
                }
            }
            if (builder != null)
                yield return CreateIterator(builder.ToString());
        }

        Iterator CreateIterator(string value)
        {
            return new Iterator(value);
        }

        #endregion
    }
}
