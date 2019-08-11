/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.hyperlambda;

namespace magic.tests.tests
{
    public class ExpressionTests
    {
        [Fact]
        public void Simple()
        {
            var x = new Expression("foo/bar");
            Assert.Equal(2, x.Iterators.Count());
            Assert.Equal("foo", x.Iterators.First().Value);
            Assert.Equal("bar", x.Iterators.Skip(1).First().Value);
        }

        [Fact]
        public void Evaluate_01()
        {
            var x = new Expression("foo/*/bar");
            var hl = "foo\n   bar\n   xxx\n   bar";
            var lambda = new Parser(hl).Lambda().Children;
            var result = x.Evaluate(lambda).ToList();
            Assert.Equal(2, result.Count());
            Assert.Equal("bar", result.First().Name);
            Assert.Equal("bar", result.Skip(1).First().Name);
        }

        [Fact]
        public void Evaluate_02()
        {
            var x = new Expression("foo/*");
            var hl = "foo\n   bar1\n   bar2\nfoo\n   bar3";
            var lambda = new Parser(hl).Lambda().Children;
            var result = x.Evaluate(lambda).ToList();
            Assert.Equal(3, result.Count());
            Assert.Equal("bar1", result.First().Name);
            Assert.Equal("bar2", result.Skip(1).First().Name);
            Assert.Equal("bar3", result.Skip(2).First().Name);
        }

        [Fact]
        public void Evaluate_03()
        {
            var x = new Expression("foo/*/bar/./$");
            var hl = "foo\n   bar\n   bar";
            var lambda = new Parser(hl).Lambda().Children;
            var result = x.Evaluate(lambda).ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
        }
    }
}
