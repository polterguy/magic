/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests
{
    public class DeleteTests
    {
        [Fact]
        public void SingleWhere()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and = new Node("and");
            and.Add(new Node("field1", "value1"));
            where.Add(and);
            node.Add(where);
            var builder = new SqlDeleteBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("delete from 'foo' where 'field1' = @0", sql);
            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("value1", arg1.Get<string>());
        }

        [Fact]
        public void MultipleWhereNodes_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and = new Node("and");
            and.Add(new Node("field1", "value1"));
            where.Add(and);
            node.Add(where);
            node.Add(new Node("where"));
            var builder = new SqlDeleteBuilder(node, "'");
            Assert.Throws<InvalidOperationException>(() => builder.Build());
        }

        [Fact]
        public void WrongBooleanGroup_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and = new Node("xor");
            and.Add(new Node("field1", "value1"));
            where.Add(and);
            node.Add(where);
            var builder = new SqlDeleteBuilder(node, "'");
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void MultipleValuesOr()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var or = new Node("or");
            or.Add(new Node("field1", "value1"));
            or.Add(new Node("field2", "value2"));
            where.Add(or);
            node.Add(where);
            var builder = new SqlDeleteBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("delete from 'foo' where 'field1' = @0 or 'field2' = @1", sql);
            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("value1", arg1.Get<string>());
            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal("value2", arg2.Get<string>());
        }
    }
}
