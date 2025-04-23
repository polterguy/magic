/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests.read
{
    public class OrderByReadTests
    {
        [Fact]
        public void OrderBySingleField()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "fieldOrder"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' order by 'fieldOrder' asc limit 25", sql);
        }

        [Fact]
        public void OrderByWithTableName()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "foo.fieldOrder"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' order by 'foo'.'fieldOrder' asc limit 25", sql);
        }

        [Fact]
        public void OrderByMultipleFields()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "foo.fieldOrder1, foo.fieldOrder2"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' order by 'foo'.'fieldOrder1' asc,'foo'.'fieldOrder2' asc limit 25", sql);
        }

        [Fact]
        public void MultipleDirections_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "fieldOrder"));
            node.Add(new Node("direction", "desc"));
            node.Add(new Node("direction", "desc"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void BadDirection_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "fieldOrder"));
            node.Add(new Node("direction", "throws"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void OrderByDescending()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "fieldOrder"));
            node.Add(new Node("direction", "desc"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' order by 'fieldOrder' desc limit 25", sql);
        }
    }
}
