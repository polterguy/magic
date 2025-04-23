/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests.read
{
    public class PagingReadTests
    {
        [Fact]
        public void LimitAndOffset()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("limit", 10));
            node.Add(new Node("offset", 5));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' limit 10 offset 5", sql);
        }

        [Fact]
        public void NegativeLimit()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("limit", -1));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo'", sql);
        }

        [Fact]
        public void MultipleLimits_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("limit", 10));
            node.Add(new Node("limit", 10));
            node.Add(new Node("offset", 5));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void MultipleOffsets_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("limit", 10));
            node.Add(new Node("offset", 5));
            node.Add(new Node("offset", 5));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }
    }
}
