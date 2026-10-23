/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    /*
     * Characterization tests for Node.GetEx, pinning how expressions are resolved to a single value,
     * such that the way it enumerates the expression's result can be changed without changing what it returns.
     */
    public class GetExCharacterizationTests
    {
        [Fact]
        public void NonExpression_ReturnsValue()
        {
            Assert.Equal("bar", new Node("foo", "bar").GetEx<string>());
            Assert.Equal(5, new Node("foo", 5).GetEx<int>());
            Assert.Null(new Node("foo").GetEx<string>());
        }

        [Fact]
        public void Expression_SingleMatch_ReturnsValueOfMatch()
        {
            var lambda = HyperlambdaParser.Parse("foo:howdy\nbar:x:@foo");
            Assert.Equal("howdy", lambda.Children.Last().GetEx<string>());
        }

        [Fact]
        public void Expression_NoMatch_ReturnsDefault()
        {
            var lambda = HyperlambdaParser.Parse("bar:x:@nothere");
            Assert.Null(lambda.Children.Last().GetEx<string>());
            Assert.Equal(0, lambda.Children.Last().GetEx<int>());
        }

        [Fact]
        public void Expression_MatchWithNullValue_ReturnsDefault()
        {
            var lambda = HyperlambdaParser.Parse("foo\nbar:x:@foo");
            Assert.Null(lambda.Children.Last().GetEx<string>());
        }

        [Fact]
        public void Expression_MultipleMatches_Throws()
        {
            var lambda = HyperlambdaParser.Parse("a:1\na:2\nb:x:../*/a");
            var exception = Assert.Throws<HyperlambdaException>(() => lambda.Children.Last().GetEx<string>());
            Assert.Equal("Multiple resulting nodes from expression.", exception.Message);
        }

        [Fact]
        public void Expression_Chain_FollowsToFinalValue()
        {
            var lambda = HyperlambdaParser.Parse("c:final\nb:x:@c\na:x:@b");
            Assert.Equal("final", lambda.Children.Last().GetEx<string>());
        }

        [Fact]
        public void Expression_Chain_EndingInNoMatch_ReturnsDefault()
        {
            var lambda = HyperlambdaParser.Parse("b:x:@nothere\na:x:@b");
            Assert.Null(lambda.Children.Last().GetEx<string>());
        }

        [Fact]
        public void Expression_Cycle_Throws()
        {
            var lambda = HyperlambdaParser.Parse("a:x:+\nb:x:-");
            var exception = Assert.Throws<HyperlambdaException>(() => lambda.Children.First().GetEx<string>());
            Assert.Contains("is recursive", exception.Message);
        }

        [Fact]
        public void Expression_ConvertsToRequestedType()
        {
            var lambda = HyperlambdaParser.Parse("n:int:7\nm:x:@n");
            Assert.Equal(7, lambda.Children.Last().GetEx<int>());
            Assert.Equal("7", lambda.Children.Last().GetEx<string>());
            Assert.Equal(7L, lambda.Children.Last().GetEx<long>());
        }

        [Fact]
        public void Expression_UsingIndexChildrenAndNameIterators()
        {
            var lambda = HyperlambdaParser.Parse("cfg\n   .\n      host:h0\n   .\n      host:h1\nv:x:@cfg/1/*/host");
            Assert.Equal("h1", lambda.Children.Last().GetEx<string>());
        }
    }
}
