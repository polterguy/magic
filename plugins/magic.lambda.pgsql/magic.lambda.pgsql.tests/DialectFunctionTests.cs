/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using Xunit;

namespace magic.lambda.pgsql.tests
{
    /*
     * The functions of the PostgreSQL dialect a read accepts in its columns, group and order entries, in addition to the
     * functions every database has, in generate-only mode so that no connection is needed. A function of another
     * dialect is rejected. Arguments are one line per '|', indented relative to the slot.
     */
    public class DialectFunctionTests
    {
        static string Generate(string args)
        {
            var hl = "pgsql.read\n   generate:bool:true\n   table:Foo\n" +
                string.Join("\n", args.Split('|').Select(x => "   " + x));
            return (string)Common.Evaluate(hl).Children.First().Value;
        }

        [Theory]
        [InlineData("columns|   to_char(created, 'YYYY-MM') as month:x|   count(*) as total:x|group|   to_char(created, 'YYYY-MM'):x|order:\"to_char(created, 'YYYY-MM')\"|limit:int:-1", "select to_char(\"created\",'YYYY-MM') as \"month\",count(*) as \"total\" from \"Foo\" group by to_char(\"created\",'YYYY-MM') order by to_char(\"created\",'YYYY-MM') asc")]
        [InlineData("order:random()|limit:int:3", "select * from \"Foo\" order by random() asc limit 3")]
        [InlineData("columns|   date_trunc('month', created) as month:x|limit:int:-1", "select date_trunc('month',\"created\") as \"month\" from \"Foo\"")]
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
