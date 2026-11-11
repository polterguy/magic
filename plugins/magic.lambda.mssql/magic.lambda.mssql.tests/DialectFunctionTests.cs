/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using Xunit;

namespace magic.lambda.mssql.tests
{
    /*
     * The functions of the SQL Server dialect a read accepts in its columns, group and order entries, in addition to the
     * functions every database has, in generate-only mode so that no connection is needed. A function of another
     * dialect is rejected. Arguments are one line per '|', indented relative to the slot.
     */
    public class DialectFunctionTests
    {
        static string Generate(string args)
        {
            var hl = "mssql.read\n   generate:bool:true\n   table:Foo\n" +
                string.Join("\n", args.Split('|').Select(x => "   " + x));
            return (string)Common.Evaluate(hl).Children.First().Value;
        }

        [Theory]
        [InlineData("columns|   format(created, 'yyyy-MM') as month:x|   count(*) as total:x|group|   format(created, 'yyyy-MM'):x|order:\"format(created, 'yyyy-MM')\"|limit:int:-1", "select format(\"created\",'yyyy-MM') as \"month\",count(*) as \"total\" from \"Foo\" group by format(\"created\",'yyyy-MM') order by format(\"created\",'yyyy-MM') asc offset 0 rows")]
        [InlineData("order:newid()|limit:int:3", "select * from \"Foo\" order by newid() asc offset 0 rows fetch next 3 rows only")]
        [InlineData("columns|   isnull(sum(price), 0) as amount:x|limit:int:-1", "select isnull(sum(\"price\"),0) as \"amount\" from \"Foo\" order by (select null) offset 0 rows")]
        public void AcceptsDialectFunction(string args, string sql)
        {
            Assert.Equal(sql, Generate(args));
        }

        [Fact]
        public void RejectsFunctionOfAnotherDialect()
        {
            Assert.ThrowsAny<Exception>(() => Generate("columns|   strftime('%Y-%m', created) as month:x|limit:int:-1"));
        }
    }
}
