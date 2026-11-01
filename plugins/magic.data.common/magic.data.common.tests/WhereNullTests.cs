/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.data.common.tests
{
    public class WhereNullTests
    {
        [Fact]
        public void NullLikeMatchesEverything()
        {
            var lambda = Common.Evaluate("sql.read\n   limit:-1\n   table:table1\n   where\n      and\n         foo1.like\n         foo2.ilike");
            Assert.Equal("select * from 'table1' where 'foo1' like '%' and 'foo2' ilike '%'", lambda.Children.First().Get<string>());
        }

        [Theory]
        [InlineData("mt")]
        [InlineData("mteq")]
        [InlineData("lt")]
        [InlineData("lteq")]
        public void NullOrderingComparisonThrows(string op)
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("sql.read\n   limit:-1\n   table:table1\n   where\n      and\n         foo1." + op));
            Assert.Contains("unsupported comparison operator for null value", ex.Message);
        }
    }
}
