/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    /*
     * Runs the expressions found in the Hyperlambda files of the repository through Expression.Create and the constructor,
     * which have to agree on every one of them. Does nothing if the files are not there.
     */
    [Collection("ExpressionCache")]
    public class ExpressionCorpusTests
    {
        static string FindFiles()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null)
            {
                var candidate = Path.Combine(dir.FullName, "backend", "files");
                if (Directory.Exists(candidate))
                    return candidate;
                dir = dir.Parent;
            }
            return null;
        }

        static void Walk(Node node, Action<Node> functor)
        {
            functor(node);
            foreach (var idx in node.Children)
                Walk(idx, functor);
        }

        static Node RandomTree(Random random, int depth)
        {
            var names = new[] { "a", "b", "c", ".dp", ".arguments", "name", "type", "url", "result", "strings.concat" };
            var node = new Node(names[random.Next(names.Length)], random.Next(3) == 0 ? "v" + random.Next(3) : null);
            if (depth > 0)
            {
                for (var idx = random.Next(0, 5); idx > 0; idx--)
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

        static string Outcome(Expression expression, Node identity)
        {
            try
            {
                return string.Join(",", expression.Evaluate(identity).Select(x => x == null ? "null" : All(identity).IndexOf(x).ToString()));
            }
            catch (Exception err)
            {
                return err.GetType().FullName + ": " + err.Message;
            }
        }

        [Fact]
        public void EveryExpressionInTheRepository_BehavesTheSame_WhetherSharedOrCreated()
        {
            var root = FindFiles();
            if (root == null)
                return;

            var lambdas = new List<Node>();
            foreach (var file in Directory.EnumerateFiles(root, "*.hl", SearchOption.AllDirectories))
            {
                try { lambdas.Add(HyperlambdaParser.Parse(File.ReadAllText(file))); } catch { }
            }
            Assert.NotEmpty(lambdas);

            var byText = new Dictionary<string, List<Expression>>();
            foreach (var lambda in lambdas)
            {
                Walk(lambda, node =>
                {
                    if (node.Value is Expression expression)
                    {
                        if (!byText.TryGetValue(expression.Value, out var list))
                            byText[expression.Value] = list = new List<Expression>();
                        list.Add(expression);
                    }
                });
            }
            Assert.NotEmpty(byText);

            // All the nodes holding the same expression share one instance.
            foreach (var (text, instances) in byText)
                Assert.True(instances.Distinct().Count() == 1, $"{text} was created {instances.Distinct().Count()} times");

            // And it does what the constructor's expression does, from many different places.
            var random = new Random(2026);
            var identities = Enumerable.Range(0, 6).Select(_ => All(RandomTree(random, 4))).ToList();
            foreach (var (text, instances) in byText)
            {
                var fresh = new Expression(text);
                Assert.Equal(fresh.Value, instances[0].Value);
                foreach (var nodes in identities)
                {
                    foreach (var identity in nodes.Take(12))
                        Assert.Equal(Outcome(fresh, identity), Outcome(instances[0], identity));
                }
            }
        }
    }
}
