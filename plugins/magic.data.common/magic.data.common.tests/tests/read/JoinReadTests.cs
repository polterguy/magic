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
    public class JoinReadTests
    {
        [Fact]
        public void Single()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            join1.Add(new Node("type", "inner"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1", "table2.pk1"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'table1' inner join 'table2' on 'table1'.'fk1' = 'table2'.'pk1' limit 25", sql);
        }

        [Fact]
        public void Nested()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            join1.Add(new Node("type", "inner"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1", "table2.pk1"));
            on1.Add(and1);
            join1.Add(on1);
            var join2 = new Node("join", "table3");
            var on2 = new Node("on");
            var and2 = new Node("and");
            and2.Add(new Node("fk2", "pk2"));
            on2.Add(and2);
            join2.Add(on2);
            join1.Add(join2);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'table1' inner join 'table2' on 'table1'.'fk1' = 'table2'.'pk1' inner join 'table3' on 'fk2' = 'pk2' limit 25", sql);
        }

        [Fact]
        public void WithOperator()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            join1.Add(new Node("type", "inner"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("fk1.neq", "pk1"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'table1' inner join 'table2' on 'fk1' != 'pk1' limit 25", sql);
        }

        [Fact]
        public void MultipleWhere()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            join1.Add(new Node("type", "inner"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1", "table2.pk1"));
            and1.Add(new Node("table1.fk2", "table2.pk2"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'table1' inner join 'table2' on 'table1'.'fk1' = 'table2'.'pk1' and 'table1'.'fk2' = 'table2'.'pk2' limit 25", sql);
        }

        [Fact]
        public void StaticWhere()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            join1.Add(new Node("type", "inner"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1", "table2.pk1"));
            and1.Add(new Node("table1.fk2", "@table2.pk2"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            node.Add(new Node("@table2.pk2", "foo"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'table1' inner join 'table2' on 'table1'.'fk1' = 'table2'.'pk1' and 'table1'.'fk2' = @table2.pk2 limit 25", sql);
            Assert.Single(result.Children);
            Assert.Equal("@table2.pk2", result.Children.First().Name);
            Assert.Equal("foo", result.Children.First().Value);
        }

        [Fact]
        public void NamespacedColumns()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "dbo.table1");
            var join1 = new Node("join", "dbo.table2");
            join1.Add(new Node("type", "inner"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("dbo.table1.fk1", "dbo.table2.pk1"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'dbo'.'table1' inner join 'dbo'.'table2' on 'dbo'.'table1'.'fk1' = 'dbo'.'table2'.'pk1' limit 25", sql);
        }

        [Fact]
        public void ImplicitJoinType()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1", "table2.pk1"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'table1' inner join 'table2' on 'table1'.'fk1' = 'table2'.'pk1' limit 25", sql);
        }

        [Fact]
        public void BadJoinType_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            join1.Add(new Node("type", "innerXX"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("fk1", "pk1"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void JoinNoOnArgument_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }
    }
}
