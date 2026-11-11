/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using Xunit;

namespace magic.lambda.mysql.tests
{
    /*
     * The functions of the MySQL dialect a read accepts in its columns, group and order entries, in addition to the
     * functions every database has, in generate-only mode so that no connection is needed. A function of another
     * dialect is rejected. Arguments are one line per '|', indented relative to the slot.
     */
    public class DialectFunctionTests
    {
        static string Generate(string args)
        {
            var hl = "mysql.read\n   generate:bool:true\n   table:Foo\n" +
                string.Join("\n", args.Split('|').Select(x => "   " + x));
            return (string)Common.Evaluate(hl).Children.First().Value;
        }

        [Theory]
        [InlineData("columns|   date_format(created, '%Y-%m') as month:x|   count(*) as total:x|group|   date_format(created, '%Y-%m'):x|order:\"date_format(created, '%Y-%m')\"|limit:int:-1", "select date_format(`created`,'%Y-%m') as `month`,count(*) as `total` from `Foo` group by date_format(`created`,'%Y-%m') order by date_format(`created`,'%Y-%m') asc")]
        [InlineData("order:rand()|limit:int:3", "select * from `Foo` order by rand() asc limit 3")]
        [InlineData("columns|   ifnull(sum(price), 0) as amount:x|limit:int:-1", "select ifnull(sum(`price`),0) as `amount` from `Foo`")]
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
