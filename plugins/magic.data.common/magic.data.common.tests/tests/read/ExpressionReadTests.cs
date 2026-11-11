/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests.read
{
    /// <summary>
    /// Tests for the expressions a read accepts as columns, group and order entries: function calls from
    /// the allowed list, nested calls, arithmetic, numbers, plain string literals, casts and inline aliases,
    /// with every identifier escaped - and the rejection of everything else.
    /// </summary>
    public class ExpressionReadTests
    {
        static string Columns(string column)
        {
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            columns.Add(new Node(column));
            node.Add(columns);
            return new SqlReadBuilder(node, "'").Build().Get<string>();
        }

        [Theory]
        [InlineData("round(avg(foo.price), 2) as average", "select round(avg('foo'.'price'),2) as 'average' from 'foo' limit 25")]
        [InlineData("count(*) as total", "select count(*) as 'total' from 'foo' limit 25")]
        [InlineData("avg(price * 1.08)", "select avg('price' * 1.08) from 'foo' limit 25")]
        [InlineData("cast(sum(price) as decimal(10,2))", "select cast(sum('price') as decimal(10,2)) from 'foo' limit 25")]
        [InlineData("coalesce(sum(total), 0)", "select coalesce(sum('total'),0) from 'foo' limit 25")]
        [InlineData("string_agg(name, ',')", "select string_agg('name',',') from 'foo' limit 25")]
        [InlineData("round((max(price) - min(price)) / 2, 1)", "select round((max('price') - min('price')) / 2,1) from 'foo' limit 25")]
        [InlineData("UPPER(name)", "select upper('name') from 'foo' limit 25")]
        public void AcceptsExpression(string column, string sql)
        {
            Assert.Equal(sql, Columns(column));
        }

        [Theory]
        [InlineData("(select password from users)")]
        [InlineData("round(price, 2); drop table foo")]
        [InlineData("lower('a'' or 1=1')")]
        [InlineData("lower('a\\')")]
        [InlineData("sum(price) -- comment")]
        [InlineData("sum(price) /* comment */")]
        [InlineData("sleep(10)")]
        [InlineData("strftime('%Y', created)")]
        [InlineData("case(price)")]
        [InlineData("count(*) as 'total'")]
        [InlineData("count(*) as total extra")]
        [InlineData("round(price, 2")]
        [InlineData("sum(1.2.3)")]
        [InlineData("sum(foo..bar)")]
        [InlineData("abs(abs(abs(abs(abs(abs(abs(abs(abs(price)))))))))")]
        public void RejectsExpression(string column)
        {
            Assert.Throws<HyperlambdaException>(() => Columns(column));
        }

        [Fact]
        public void InlineAndArgumentAliasTogetherThrows()
        {
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            var column = new Node("count(*) as total");
            column.Add(new Node("as", "other"));
            columns.Add(column);
            node.Add(columns);
            var builder = new SqlReadBuilder(node, "'");

            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void GroupAndOrderByExpression()
        {
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var columns = new Node("columns");
            columns.Add(new Node("lower(name)"));
            node.Add(columns);
            var group = new Node("group");
            group.Add(new Node("lower(name)"));
            node.Add(group);
            var order = new Node("order", "round(avg(price), 2)");
            order.Add(new Node("direction", "desc"));
            node.Add(order);
            var builder = new SqlReadBuilder(node, "'");

            Assert.Equal(
                "select lower('name') from 'foo' group by lower('name') order by round(avg('price'),2) desc limit 25",
                builder.Build().Get<string>());
        }
    }
}
