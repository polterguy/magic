/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Xunit;
using magic.node;
using System;

namespace magic.tests.tests
{
    public class NodeTests
    {
        [Fact]
        public void CreateDefault()
        {
            var node = new Node();
            Assert.Equal("", node.Name);
            Assert.Null(node.Value);
            Assert.NotNull(node.Children);
            Assert.Empty(node.Children);
        }

        [Fact]
        public void CreateNamed()
        {
            var node = new Node("foo");
            Assert.Equal("foo", node.Name);
        }

        [Fact]
        public void CreateNamed_Throws()
        {
            Assert.Throws<ArgumentNullException>(() => new Node(null));
        }

        [Fact]
        public void ChangeName_Throws()
        {
            var node = new Node("foo");
            Assert.Throws<ArgumentNullException>(() =>
            {
                node.Name = null;
            });
        }

        [Fact]
        public void CreateNamedWithValue()
        {
            var node = new Node("foo", 5);
            Assert.Equal("foo", node.Name);
            Assert.Equal(5, node.Value);
        }

        [Fact]
        public void RetrieveValueTyped()
        {
            var node = new Node("foo", 5);
            Assert.Equal(5, node.Get<int>());
        }

        [Fact]
        public void RetrieveValueConverted_01()
        {
            var node = new Node("foo", 5);
            Assert.Equal(5M, node.Get<decimal>());
        }

        [Fact]
        public void RetrieveValueConverted_02()
        {
            var node = new Node("foo", 5);
            Assert.Equal("5", node.Get<string>());
        }
    }
}
