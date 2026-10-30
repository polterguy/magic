/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    /*
     * Node.MoveChildrenFrom must leave exactly what AddRange(source.Children) leaves, only faster.
     */
    public class MoveChildrenTests
    {
        const string _tree = @"
foo:1
   a:x
      deep:y
   b
   c:z
";

        [Fact]
        public void Move_GivesTheSameResultAsAddRange()
        {
            var viaAddRange = HyperlambdaParser.Parse(_tree);
            var viaMove = HyperlambdaParser.Parse(_tree);
            var targetA = new Node("target", "t");
            var targetB = new Node("target", "t");
            targetA.Add(new Node("existing"));
            targetB.Add(new Node("existing"));

            targetA.AddRange(viaAddRange.Children.First().Children.ToList());
            targetB.MoveChildrenFrom(viaMove.Children.First());

            Assert.Equal(Describe(targetA), Describe(targetB));
            Assert.Equal(Describe(viaAddRange), Describe(viaMove));
        }

        [Fact]
        public void Move_AppendsAfterExistingChildren_KeepingOrder()
        {
            var source = new Node("source");
            source.Add(new Node("1"));
            source.Add(new Node("2"));
            source.Add(new Node("3"));
            var target = new Node("target");
            target.Add(new Node("a"));

            target.MoveChildrenFrom(source);

            Assert.Equal<string>(["a", "1", "2", "3"], target.Children.Select(x => x.Name).ToArray());
        }

        [Fact]
        public void Move_EmptiesSource_AndReparentsEveryChild()
        {
            var source = new Node("source");
            var first = new Node("1");
            var second = new Node("2");
            source.Add(first);
            source.Add(second);
            var target = new Node("target");

            target.MoveChildrenFrom(source);

            Assert.Empty(source.Children);
            Assert.Same(target, first.Parent);
            Assert.Same(target, second.Parent);
            Assert.Same(second, first.Next);
            Assert.Null(first.Previous);
        }

        [Fact]
        public void Move_KeepsGrandchildren()
        {
            var source = HyperlambdaParser.Parse("a\n   b\n      c:z\n");
            var target = new Node("target");

            target.MoveChildrenFrom(source);

            var a = target.Children.Single();
            Assert.Equal("c", a.Children.Single().Children.Single().Name);
            Assert.Same(target, a.Parent);
        }

        [Fact]
        public void Move_FromEmptySource_ChangesNothing()
        {
            var target = new Node("target");
            target.Add(new Node("a"));

            target.MoveChildrenFrom(new Node("empty"));

            Assert.Single(target.Children);
        }

        [Fact]
        public void Move_FromItself_ChangesNothing()
        {
            var node = new Node("n");
            node.Add(new Node("1"));
            node.Add(new Node("2"));

            node.MoveChildrenFrom(node);

            Assert.Equal<string>(["1", "2"], node.Children.Select(x => x.Name).ToArray());
        }

        [Fact]
        public void Move_ToANodeThatIsLaterEdited_DoesNotAffectTheSource()
        {
            var source = new Node("source");
            source.Add(new Node("1"));
            var target = new Node("target");
            target.MoveChildrenFrom(source);

            target.Add(new Node("2"));
            source.Add(new Node("3"));

            Assert.Equal<string>(["1", "2"], target.Children.Select(x => x.Name).ToArray());
            Assert.Equal<string>(["3"], source.Children.Select(x => x.Name).ToArray());
        }

        [Fact]
        public void Move_ManyChildren_KeepsOrderAndParents()
        {
            var source = new Node("source");
            for (var idx = 0; idx < 50000; idx++)
            {
                source.Add(new Node(idx.ToString()));
            }
            var target = new Node("target");

            target.MoveChildrenFrom(source);

            Assert.Empty(source.Children);
            Assert.Equal(50000, target.Children.Count());
            Assert.Equal("0", target.Children.First().Name);
            Assert.Equal("49999", target.Children.Last().Name);
            Assert.All(target.Children, x => Assert.Same(target, x.Parent));
        }

        static string Describe(Node node)
        {
            return HyperlambdaGenerator.GetHyperlambda(new[] { node });
        }
    }
}
