/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests.read
{
    /// <summary>
    /// Regression tests verifying SQL injection attempts through [order], [group],
    /// [columns], table aliases and join [on] argument references are either
    /// correctly escaped or rejected with an exception.
    /// </summary>
    public class SqlInjectionReadTests
    {
        [Fact]
        public void OrderBySubSelect_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "(select password from users limit 1)"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void OrderByCaseWhen_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "(case when 1=1 then field1 else field2 end)--"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void OrderBySleep_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "(select sleep(5))"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void OrderByValidAggregate()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "count(*)"));
            node.Add(new Node("direction", "desc"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' order by count(*) desc limit 25", sql);
        }

        [Fact]
        public void OrderByPerOrderDirection()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var order = new Node("order", "fieldOrder");
            order.Add(new Node("direction", "desc"));
            node.Add(order);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' order by 'fieldOrder' desc limit 25", sql);
        }

        [Fact]
        public void OrderByPerOrderDirectionInjection_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var order = new Node("order", "fieldOrder");
            order.Add(new Node("direction", "desc; drop table foo;--"));
            node.Add(order);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void OrderByNonAggregateIsEscaped()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("order", "field1); drop table foo;--"));
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' order by 'field1); drop table foo;--' asc limit 25", sql);
        }

        [Fact]
        public void GroupByInjection_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var group = new Node("group");
            group.Add(new Node("count(*)); drop table foo;--"));
            node.Add(group);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void GroupByValidAggregate()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var group = new Node("group");
            group.Add(new Node("field1"));
            group.Add(new Node("count(*)"));
            node.Add(group);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' group by 'field1',count(*) limit 25", sql);
        }

        [Fact]
        public void ColumnsAggregateInjection_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            columns.Add(new Node("count(*)); drop table foo;--"));
            node.Add(columns);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void ColumnsAggregateValid()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            var aggregate = new Node("min(foo.field1)");
            aggregate.Add(new Node("as", "result"));
            columns.Add(aggregate);
            node.Add(columns);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            // Notice, the aggregate's operand is escaped just like every other identifier in the statement.
            Assert.Equal("select min('foo'.'field1') as 'result' from 'foo' limit 25", sql);
        }

        [Fact]
        public void TableAliasInjection_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table = new Node("table", "foo");
            table.Add(new Node("as", "bar'; drop table foo;--"));
            node.Add(table);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void TableAliasValid()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table = new Node("table", "foo");
            table.Add(new Node("as", "t1"));
            node.Add(table);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' 't1' limit 25", sql);
        }

        [Fact]
        public void JoinAliasInjection_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            join1.Add(new Node("as", "x'; drop table foo;--"));
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1", "table2.pk1"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void JoinOnArgumentInjection_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1.eq", "@0; drop table foo;--"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void JoinOnArgumentReference()
        {
            // Creating node hierarchy.
            var node = new Node();
            var table1 = new Node("table", "table1");
            var join1 = new Node("join", "table2");
            var on1 = new Node("on");
            var and1 = new Node("and");
            and1.Add(new Node("table1.fk1.eq", "@0"));
            on1.Add(and1);
            join1.Add(on1);
            table1.Add(join1);
            node.Add(table1);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'table1' inner join 'table2' on 'table1'.'fk1' = @0 limit 25", sql);
        }
    }
}
