/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests.read
{
    public class ReadTests
    {
        [Fact]
        public void Simple()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' limit 25", sql);
        }

        [Fact]
        public void EmptyWhere()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' limit 25", sql);
        }

        [Fact]
        public void ExplicitColumns()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "table"));
            var columns = new Node("columns");
            columns.Add(new Node("foo"));
            columns.Add(new Node("bar"));
            node.Add(columns);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select 'foo','bar' from 'table' limit 25", sql);
        }

        [Fact]
        public void AggregateColumn()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            columns.Add(new Node("count(*)"));
            node.Add(columns);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select count(*) from 'foo' limit 25", sql);
        }

        [Fact]
        public void NamespacedTable()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo.bar"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo'.'bar' limit 25", sql);
        }

        [Fact]
        public void NoTable_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void MultipleColumns_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            columns.Add(new Node("count(*)"));
            node.Add(columns);
            var columns2 = new Node("columns");
            columns2.Add(new Node("count(*)"));
            node.Add(columns2);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void NestedWhereLevels_01()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            and1.Add(new Node("foo1", 5));
            and1.Add(new Node("foo2", "howdy"));
            var or1 = new Node("or");
            or1.Add(new Node("foo3", "jalla"));
            or1.Add(new Node("foo4", "balla"));
            and1.Add(or1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'foo1' = @0 and 'foo2' = @1 and ('foo3' = @2 or 'foo4' = @3) limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);

            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal("howdy", arg2.Value);

            var arg3 = result.Children.Skip(2).First();
            Assert.Equal("@2", arg3.Name);
            Assert.Equal("jalla", arg3.Value);

            var arg4 = result.Children.Skip(3).First();
            Assert.Equal("@3", arg4.Name);
            Assert.Equal("balla", arg4.Value);
        }

        [Fact]
        public void NestedWhereLevels_02()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var or1 = new Node("or");
            or1.Add(new Node("foo1", 5));
            or1.Add(new Node("foo2", "howdy"));
            var and2 = new Node("and");
            and2.Add(new Node("foo3", "jalla"));
            and2.Add(new Node("foo4", "balla"));
            or1.Add(and2);
            where.Add(or1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'foo1' = @0 or 'foo2' = @1 or ('foo3' = @2 and 'foo4' = @3) limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);

            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal("howdy", arg2.Value);

            var arg3 = result.Children.Skip(2).First();
            Assert.Equal("@2", arg3.Name);
            Assert.Equal("jalla", arg3.Value);

            var arg4 = result.Children.Skip(3).First();
            Assert.Equal("@3", arg4.Name);
            Assert.Equal("balla", arg4.Value);
        }

        [Fact]
        public void NamespacedCondition()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var cond1 = new Node("foo.field1", 5);
            and1.Add(cond1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'foo'.'field1' = @0 limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5, arg1.Value);
        }

        [Fact]
        public void EscapedColumnName()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            columns.Add(new Node("\\foo.bar.howdy", 5));
            node.Add(columns);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select 'foo.bar.howdy' from 'foo' limit 25", sql);
        }

        [Fact]
        public void PrefixedColumnName()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            columns.Add(new Node("bar.howdy", 5));
            node.Add(columns);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select 'bar'.'howdy' from 'foo' limit 25", sql);
        }
    }
}
