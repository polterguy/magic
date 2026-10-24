/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using System.Collections.Concurrent;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    /*
     * Tests for Expression.Create, which shares the expression created for a string with whoever asks for it next. It
     * must never change what an expression does, only how many of them there are. All of these are in one collection, since
     * what the cache holds is shared by the whole process, and registering an iterator empties it.
     */
    [Collection("ExpressionCache")]
    public class ExpressionCacheTests
    {
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

        static void AssertSameBehavior(string text, IEnumerable<Node> identities)
        {
            Expression made = null, created = null;
            string madeError = null, createdError = null;
            try { made = new Expression(text); } catch (Exception err) { madeError = err.GetType().FullName + ": " + err.Message; }
            try { created = Expression.Create(text); } catch (Exception err) { createdError = err.GetType().FullName + ": " + err.Message; }
            Assert.Equal(madeError, createdError);
            if (made == null)
                return;

            Assert.Equal(made.Value, created.Value);
            foreach (var identity in identities)
            {
                var expected = Run(() => made.Evaluate(identity).ToList());
                var actual = Run(() => created.Evaluate(identity).ToList());
                Assert.Equal(expected.Error, actual.Error);
                if (expected.Nodes != null)
                    Assert.True(expected.Nodes.SequenceEqual(actual.Nodes, ReferenceEqualityComparer.Instance as IEqualityComparer<Node>), $"{text}: different nodes");
            }
        }

        // Reads the two generations the cache holds.
        static (ConcurrentDictionary<string, Expression> Current, ConcurrentDictionary<string, Expression> Previous) CacheGenerations()
        {
            var generations = typeof(Expression).GetField("_generations", BindingFlags.NonPublic | BindingFlags.Static).GetValue(null);
            var type = generations.GetType();
            return ((ConcurrentDictionary<string, Expression>)type.GetField("Current").GetValue(generations),
                (ConcurrentDictionary<string, Expression>)type.GetField("Previous").GetValue(generations));
        }

        static bool CacheContains(string text)
        {
            var (current, previous) = CacheGenerations();
            return current.ContainsKey(text) || previous.ContainsKey(text);
        }

        [Fact]
        public void TheSameString_GivesTheSameInstance()
        {
            Assert.Same(Expression.Create("@.arguments/*/name"), Expression.Create("@.arguments/*/name"));
            Assert.NotSame(Expression.Create("@.arguments/*/name"), Expression.Create("@.arguments/*/other"));
            Assert.NotSame(Expression.Create("@.arguments/*/name"), new Expression("@.arguments/*/name"));
        }

        [Fact]
        public void IsTheExpressionTheConstructorWouldCreate_OnRandomExpressionsAndTrees()
        {
            var tokens = new[] { "a", "b", "c", ".d", "e", "*", "*", "**", "..", ".", "-", "+", "@a", "@b", "^a", "!a", "0", "1", "2", "[0,2]", "[1,3]", "[a|b]", "=v1", "=v0", "\\a", "{@a/*}", "={@a/*}", "\"a/b\"", "#" };
            var random = new Random(31337);
            for (var iteration = 0; iteration < 5000; iteration++)
            {
                var nodes = All(RandomTree(random, 3));
                var text = string.Join("/", Enumerable.Range(0, random.Next(1, 7)).Select(_ => tokens[random.Next(tokens.Length)]));
                AssertSameBehavior(text, [nodes[random.Next(nodes.Count)], nodes[random.Next(nodes.Count)]]);

                // Asking again, which is where the shared one comes from, must behave the same.
                AssertSameBehavior(text, [nodes[random.Next(nodes.Count)]]);
            }
        }

        [Theory]
        [InlineData("\"unterminated")]
        [InlineData("a/{@unterminated")]
        [InlineData("a/\"b")]
        public void AnInvalidString_ThrowsEveryTime_AndIsNotRemembered(string text)
        {
            var made = Record.Exception(() => new Expression(text));
            Assert.NotNull(made);
            for (var idx = 0; idx < 3; idx++)
            {
                var created = Record.Exception(() => Expression.Create(text));
                Assert.NotNull(created);
                Assert.Equal(made.GetType(), created.GetType());
                Assert.Equal(made.Message, created.Message);
            }
            Assert.False(CacheContains(text));
        }

        [Fact]
        public void TheCache_IsBounded_AndKeepsWhatWasUsedRecently()
        {
            var kept = Expression.Create("kept-" + Guid.NewGuid().ToString("N"));
            var droppedText = "dropped-" + Guid.NewGuid().ToString("N");
            var dropped = Expression.Create(droppedText);
            var keptText = kept.Value;

            // Far more distinct strings than it can hold, touching one of the first ones all the time.
            for (var idx = 0; idx < 30000; idx++)
            {
                Expression.Create("bounded-" + idx);
                if (idx % 500 == 0)
                    Assert.Same(kept, Expression.Create(keptText));
            }

            var (current, previous) = CacheGenerations();
            Assert.True(current.Count <= 4097, $"current generation holds {current.Count}");
            Assert.True(previous.Count <= 4097, $"previous generation holds {previous.Count}");
            Assert.Same(kept, Expression.Create(keptText));
            Assert.NotSame(dropped, Expression.Create(droppedText)); // Not used for 30,000 strings, so it was let go
        }

        [Fact]
        public void AVeryLongString_IsNotRemembered()
        {
            var text = string.Join("/", Enumerable.Repeat("aaaaaaaaaa", 40));
            Assert.True(text.Length > 256);
            Assert.NotSame(Expression.Create(text), Expression.Create(text));
        }

        [Fact]
        public void RegisteringAStaticIterator_MakesEveryoneForgetWhatTheStringMeantBefore()
        {
            var name = "cache-test-static-iterator";
            var root = new Node("root");
            var before = Expression.Create(name);
            Assert.Empty(before.Evaluate(root)); // A plain name lookup, and nothing is called that

            Iterator.AddStaticIterator(name, (identity, input) => [identity]);
            var after = Expression.Create(name);
            Assert.NotSame(before, after);
            Assert.Same(root, Assert.Single(after.Evaluate(root)));
        }

        [Fact]
        public void RegisteringADynamicIterator_MakesEveryoneForgetWhatTheStringMeantBefore()
        {
            var root = new Node("root");
            var before = Expression.Create("~cache-test");
            Assert.Empty(before.Evaluate(root));

            Iterator.AddDynamicIterator('~', (iteratorValue) => (identity, input) => [identity]);
            var after = Expression.Create("~cache-test");
            Assert.NotSame(before, after);
            Assert.Same(root, Assert.Single(after.Evaluate(root)));
        }

        [Fact]
        public void TheParser_SharesTheExpressionsOfEqualStrings()
        {
            var lambda = HyperlambdaParser.Parse(".a:x:@.cache-test/*\n.b:x:@.cache-test/*\n.c:x:@.cache-test-other/*\n");
            var nodes = lambda.Children.ToList();
            Assert.Same(nodes[0].Value, nodes[1].Value);
            Assert.NotSame(nodes[0].Value, nodes[2].Value);
        }

        [Fact]
        public void AnExtrapolatedIterator_IsEvaluatedEveryTime_AndNeverRemembersWhatItYielded()
        {
            var root = new Node("root");
            var arguments = new Node(".arguments");
            var genre = new Node("genre", "Jazz");
            arguments.Add(genre);
            root.Add(arguments);
            foreach (var value in new[] { "Jazz", "Rock", "Jazz", "Pop" })
            {
                var row = new Node(".");
                row.Add(new Node("genre", value));
                root.Add(row);
            }
            // The rows with the genre asked for, and the [.arguments] node itself, which has a [genre] child with that very value.
            var expression = new Expression("*/*/genre/={*/.arguments/*/genre}/.");
            Assert.Equal(3, expression.Evaluate(root).Count()); // Two Jazz rows

            genre.Value = "Rock";
            Assert.Equal(2, expression.Evaluate(root).Count());

            genre.Value = "Pop";
            Assert.Equal(2, expression.Evaluate(root).Count());

            genre.Value = "Blues";
            Assert.Single(expression.Evaluate(root));
        }

        [Fact]
        public void AnExtrapolatedIterator_StillThrowsWhenItsNestedExpressionYieldsTwoNodes_EveryTime()
        {
            var root = new Node("root");
            var holder = new Node("holder");
            holder.Add(new Node("x"));
            holder.Add(new Node("x"));
            root.Add(holder);
            var expression = new Expression("root/{*/*}");
            for (var idx = 0; idx < 3; idx++)
                Assert.Throws<HyperlambdaException>(() => expression.Evaluate(root).ToList());
        }

        [Fact]
        public void Concurrently_EveryoneGetsAWorkingExpression_AndEqualStringsEndUpShared()
        {
            var errors = new ConcurrentBag<string>();
            var results = new ConcurrentDictionary<string, ConcurrentBag<Expression>>();
            System.Threading.Tasks.Parallel.For(0, 64, worker =>
            {
                var random = new Random(worker);
                var root = new Node("root");
                root.Add(new Node("a", "v"));
                for (var idx = 0; idx < 3000; idx++)
                {
                    var text = "concurrent-" + random.Next(200) + "/*";
                    var expression = Expression.Create(text);
                    if (expression.Value != text)
                        errors.Add(text);
                    results.GetOrAdd(text, _ => new()).Add(expression);
                }
            });
            Assert.Empty(errors);
            Assert.All(results, x => Assert.True(x.Value.Distinct().Count() <= 3, $"{x.Key} ended up as {x.Value.Distinct().Count()} instances"));
        }
    }
}
