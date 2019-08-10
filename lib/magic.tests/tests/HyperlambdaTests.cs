/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;
using magic.hyperlambda;

namespace magic.tests.tests
{
    public class HyperlambdaTests
    {
        [Fact]
        public void ParseString_01()
        {
            var result = new Parser("").Lambda().Children.ToList();
            Assert.Empty(result);
        }

        [Fact]
        public void ParseString_02()
        {
            var result = new Parser("foo").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void ParseString_03()
        {
            var result = new Parser("foo:").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void ParseString_04()
        {
            var result = new Parser("foo:bar").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("bar", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void ParseString_05()
        {
            var result = new Parser("foo:int:5").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal(5, result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void ParseString_06()
        {
            var result = new Parser("foo1:bar1\r\nfoo2:bar2").Lambda().Children.ToList();
            Assert.Equal(2, result.Count());
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal("bar1", result.First().Value);
            Assert.Empty(result.First().Children);
            Assert.Equal("foo2", result.Skip(1).First().Name);
            Assert.Equal("bar2", result.Skip(1).First().Value);
            Assert.Empty(result.Skip(1).First().Children);
        }

        [Fact]
        public void ParseString_07()
        {
            var result = new Parser("foo\r\n  bar").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Single(result.First().Children);
            Assert.Equal("bar", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
        }

        [Fact]
        public void ParseString_08()
        {
            var result = new Parser("foo1\r\n  bar\r\nfoo2").Lambda().Children.ToList();
            Assert.Equal(2, result.Count);
            Assert.Equal("foo1", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Single(result.First().Children);
            Assert.Equal("bar", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
            Assert.Equal("foo2", result.Skip(1).First().Name);
            Assert.Null(result.Skip(1).First().Value);
            Assert.Empty(result.Skip(1).First().Children);
        }

        [Fact]
        public void ParseString_09()
        {
            var result = new Parser("foo1\r\n  bar1\r\n    bar2\r\n  bar3").Lambda().Children.ToList();
            Assert.Equal(1, result.Count);
            Assert.Equal("foo1", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Equal(2, result.First().Children.Count());
            Assert.Equal("bar1", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
            Assert.Equal("bar2", result.First().Children.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Children.First().Value);
            Assert.Equal("bar3", result.First().Children.Skip(1).First().Name);
        }
    }
}
