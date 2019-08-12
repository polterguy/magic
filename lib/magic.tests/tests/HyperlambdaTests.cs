/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Xunit;
using magic.node;
using magic.hyperlambda;
using magic.tests.tests.lambda;

namespace magic.tests.tests
{
    public class HyperlambdaTests
    {
        [Fact]
        public void Empty()
        {
            var result = new Parser("").Lambda().Children.ToList();
            Assert.Empty(result);
        }

        [Fact]
        public void SingleNode()
        {
            var result = new Parser("foo").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithEmptyValue()
        {
            var result = new Parser("foo:").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithValue()
        {
            var result = new Parser("foo:bar").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("bar", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithTypedValue()
        {
            var result = new Parser("foo:int:5").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal(5, result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void TwoRootNodes()
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
        public void NodeWithChildren()
        {
            var result = new Parser("foo\r\n   bar").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Single(result.First().Children);
            Assert.Equal("bar", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
        }

        [Fact]
        public void TwoRootNodesWithChildren()
        {
            var result = new Parser("foo1\r\n   bar\r\nfoo2").Lambda().Children.ToList();
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
        public void ComplexHierarchy()
        {
            var result = new Parser("foo1\r\n   bar1\r\n      bar2\r\n   bar3").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Equal(2, result.First().Children.Count());
            Assert.Equal("bar1", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
            Assert.Equal("bar2", result.First().Children.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Children.First().Value);
            Assert.Equal("bar3", result.First().Children.Skip(1).First().Name);
        }

        [Fact]
        public void DoubleQuotedString()
        {
            var result = new Parser(@"foo1:"" howdy world """).Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy world ", result.First().Value);
        }

        [Fact]
        public void SingleQuotedString()
        {
            var result = new Parser("foo1:' howdy world '").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy world ", result.First().Value);
        }

        [Fact]
        public void MultilineString()
        {
            var result = new Parser("foo1:@\" howdy\nworld \"").Lambda().Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy\nworld ", result.First().Value);
        }

        [Fact]
        public void SpacingError_Throws()
        {
            Assert.Throws<ApplicationException>(() => new Parser("foo1\r\n bar1"));
        }

        [Fact]
        public void String2Lambda()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "foo\n   bar");
            signaler.Signal("lambda", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal("bar", node.Children.First().Children.First().Name);
            Assert.Null(node.Value);
        }

        [Fact]
        public void Lambda2String()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("");
            node.Add(new Node("foo"));
            node.Children.First().Add(new Node("bar"));
            signaler.Signal("hyper", node);
            Assert.Equal("foo\n   bar\n", node.Value);
        }

        [Fact]
        public void String2LambdaToString_01()
        {
            var hl = @"foo
   bar:int:57
      howdy:decimal:57
   barx
jo:dude
".Replace("\r\n", "\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void String2LambdaToString_02()
        {
            var hl = @"foo
   bar:"" howdy\"" world ""
      howdy:@""
XXX""
   barx
jo:dude
".Replace("\r\n", "\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void String2LambdaToString_03()
        {
            var hl = @"foo
   bar:""foo:bar""
      howdy:@""
XXX""
   barx
jo:dude
".Replace("\r\n", "\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void String2LambdaToString_04()
        {
            var hl = @"foo
   bar:@""foo:bar
      """"jo:dude""""
""
      howdy:@""
XXX""
   barx
jo:dude
".Replace("\r\n", "\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("hyper", node);
            Assert.Equal(hl, node.Value);
        }
    }
}
