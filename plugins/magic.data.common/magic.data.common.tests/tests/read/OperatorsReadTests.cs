/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.helpers;
using magic.data.common.builders;

namespace magic.data.common.tests.tests.read
{
    public class OperatorsReadTests
    {
        [Fact]
        public void EqualsOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.eq", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' = @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void NotEqualsOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.neq", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' != @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void MoreThanOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.mt", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' > @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void LessThanOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.lt", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' < @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void MoreThanOrEqualsOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.mteq", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' >= @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void LessThanOrEqualsOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.lteq", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' <= @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void LikeOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.like", "howdy%");
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' like @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy%", arg1.Value);
        }

        [Fact]
        public void EscapedCondition()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("\\field1.lteq", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1.lteq' = @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void EscapedOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("field1.\\lteq", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1'.'lteq' = @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void CustomComparisonOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            var where = new Node("where");
            var and1 = new Node("and");
            and1.Add(new Node("foo1.qwerty", "howdy"));
            where.Add(and1);
            node.Add(where);
            node.Add(new Node("table", "foo"));

            // Adding our custom operator.
            SqlWhereBuilder.AddComparisonOperator("qwerty", (builder, args, colNode, escapeChar, kind) => {
                builder.Append(" <> ");
                SqlWhereBuilder.AppendArgs(args, colNode, builder, escapeChar, kind);
            });

            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'foo1' <> @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Value);
        }
    }
}
