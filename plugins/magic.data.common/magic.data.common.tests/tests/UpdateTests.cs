/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests
{
    public class UpdateTests
    {
        [Fact]
        public void SingleFieldSingleWhere()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            node.Add(values);
            var where = new Node("where");
            var and = new Node("and");
            and.Add(new Node("field2", "value2"));
            where.Add(and);
            node.Add(where);
            var builder = new SqlUpdateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("update 'foo' set 'field1' = @v0 where 'field2' = @0", sql);
            var arg1 = result.Children.First();
            Assert.Equal("@v0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());
            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@0", arg2.Name);
            Assert.Equal("value2", arg2.Get<string>());
        }

        [Fact]
        public void MultipleValuesSingleWhere()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            values.Add(new Node("field2", "world"));
            node.Add(values);
            var where = new Node("where");
            var and = new Node("and");
            and.Add(new Node("field2", "value2"));
            where.Add(and);
            node.Add(where);
            var builder = new SqlUpdateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("update 'foo' set 'field1' = @v0, 'field2' = @v1 where 'field2' = @0", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@v0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());

            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@v1", arg2.Name);
            Assert.Equal("world", arg2.Get<string>());

            var arg3 = result.Children.Skip(2).First();
            Assert.Equal("@0", arg3.Name);
            Assert.Equal("value2", arg3.Get<string>());
        }

        [Fact]
        public void NullValueSingleWhere()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field2"));
            node.Add(values);
            var where = new Node("where");
            var and = new Node("and");
            and.Add(new Node("field2", "value2"));
            where.Add(and);
            node.Add(where);
            var builder = new SqlUpdateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("update 'foo' set 'field2' = null where 'field2' = @0", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("value2", arg1.Get<string>());
        }

        [Fact]
        public void NoValues_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            node.Add(values);
            var where = new Node("where");
            var and = new Node("and");
            and.Add(new Node("field2", "value2"));
            where.Add(and);
            node.Add(where);
            var builder = new SqlUpdateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void NoValueNode_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and = new Node("and");
            and.Add(new Node("field2", "value2"));
            where.Add(and);
            node.Add(where);
            var builder = new SqlUpdateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }
    }
}
