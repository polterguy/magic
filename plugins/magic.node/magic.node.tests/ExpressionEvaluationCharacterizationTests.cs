/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.node.tests
{
    /*
     * Pins [Expression.Evaluate] and the [@] and [^] iterators against verbatim copies of the implementations they had
     * before they were optimised, over thousands of random trees and expressions.
     */
    [Collection("ExpressionCache")]
    public class ExpressionEvaluationCharacterizationTests
    {
        // The original Expression.Evaluate: an emptiness check after every single iterator.
        static List<Node> ReferenceEvaluate(Expression expression, Node identity)
        {
            IEnumerable<Node> result = [identity];
            foreach (var idx in expression.Iterators)
            {
                result = idx.Evaluate(identity, result);
                if (!result.Any())
                    return [];
            }
            return result.ToList();
        }

        // The original [@] iterator, walking elder siblings through Node.Previous.
        static Node ReferenceAncestorOrElder(Node first, string name)
        {
            var cur = first?.Previous ?? first?.Parent;
            while (cur != null && cur.Name != name)
            {
                var previous = cur.Previous;
                if (previous == null)
                    cur = cur.Parent;
                else
                    cur = previous;
            }
            return cur;
        }

        static readonly string[] _names = ["a", "b", "c", ".d", "e"];

        static Node RandomTree(Random random, int depth)
        {
            var node = new Node(_names[random.Next(_names.Length)], random.Next(3) == 0 ? "v" + random.Next(3) : null);
            if (depth > 0)
            {
                for (var idx = random.Next(0, 6); idx > 0; idx--)
                    node.Add(RandomTree(random, depth - 1));
            }
            return node;
        }

        static List<Node> All(Node root)
        {
            var result = new List<Node> { root };
            foreach (var idx in root.Children)
                result.AddRange(All(idx));
            return result;
        }

        static (List<Node> Nodes, string Error) Run(Func<List<Node>> functor)
        {
            try
            {
                return (functor(), null);
            }
            catch (Exception err)
            {
                return (null, err.GetType().FullName + ": " + err.Message);
            }
        }

        [Fact]
        public void AncestorIterator_MatchesTheOriginalOnRandomTrees()
        {
            var random = new Random(77);
            for (var tree = 0; tree < 300; tree++)
            {
                var root = RandomTree(random, 4);
                foreach (var node in All(root))
                {
                    foreach (var name in _names.Append("missing"))
                    {
                        var expected = ReferenceAncestorOrElder(node, name);
                        var actual = new Expression("@" + name).Evaluate(node).ToList();
                        if (expected == null)
                            Assert.Empty(actual);
                        else
                            Assert.Same(expected, Assert.Single(actual));
                    }
                }
            }
        }

        [Fact]
        public void AncestorIterator_ManySiblings_FindsTheNearestElderSibling()
        {
            var root = new Node("root");
            for (var idx = 0; idx < 2000; idx++)
                root.Add(new Node(idx % 500 == 0 ? "target" : "other", idx));
            var last = root.Children.Last();
            var found = Assert.Single(new Expression("@target").Evaluate(last).ToList());
            Assert.Equal(1500, found.Value); // Nearest elder sibling named [target], not the first one
        }

        [Fact]
        public void Evaluate_MatchesTheOriginalOnRandomExpressions()
        {
            var tokens = new[] { "a", "b", "c", ".d", "e", "*", "*", "**", "..", ".", "-", "+", "@a", "@b", "^a", "!a", "0", "1", "2", "[0,2]", "[1,3]", "[a|b]", "=v1", "=v0", "\\a", "{@a/*}", "={@a/*}" };
            var random = new Random(4242);
            for (var iteration = 0; iteration < 6000; iteration++)
            {
                var root = RandomTree(random, 3);
                var nodes = All(root);
                var identity = nodes[random.Next(nodes.Count)];
                var text = string.Join("/", Enumerable.Range(0, random.Next(1, 7)).Select(_ => tokens[random.Next(tokens.Length)]));
                Expression expression;
                try { expression = new Expression(text); } catch { continue; }
                var expected = Run(() => ReferenceEvaluate(expression, identity));
                var actual = Run(() => expression.Evaluate(identity).ToList());
                Assert.True(expected.Error == actual.Error, $"{text}: expected error '{expected.Error}', got '{actual.Error}'");
                if (expected.Nodes != null)
                    Assert.True(expected.Nodes.SequenceEqual(actual.Nodes, ReferenceEqualityComparer.Instance as IEqualityComparer<Node>), $"{text}: different nodes");
            }
        }

        [Fact]
        public void Evaluate_AnExtrapolatedIteratorAfterAnEmptyStep_IsNeverEvaluated()
        {
            // The nested expression yields two nodes, which would throw, but the first step is already empty.
            var root = new Node("root");
            var holder = new Node("holder");
            holder.Add(new Node("x"));
            holder.Add(new Node("x"));
            root.Add(holder);
            Assert.Empty(new Expression("missing/{holder/*}").Evaluate(root));
            Assert.Empty(new Expression("missing/={holder/*}").Evaluate(root));
        }

        [Fact]
        public void Evaluate_ACustomIteratorAfterAnEmptyStep_IsNeverReached()
        {
            Iterator.AddStaticIterator("characterization-constant-iterator", (identity, input) => [identity]);
            var root = new Node("root");
            Assert.Empty(new Expression("missing/characterization-constant-iterator").Evaluate(root));
            Assert.Single(new Expression("root/characterization-constant-iterator").Evaluate(root));
        }
    }
}
