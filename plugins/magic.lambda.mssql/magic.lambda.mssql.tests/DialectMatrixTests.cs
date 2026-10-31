/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;

namespace magic.lambda.mssql.tests
{
    /*
     * Feeds the create, read, update and delete slots the same inputs as every other database plugin does,
     * in generate-only mode so that no connection is needed, and pins the SQL and parameters they produce for SQL Server.
     * The inputs are identical in the mssql, pgsql, mysql and sqlite test projects, so a difference between dialects is
     * always a difference between the expected values below. Arguments are one line per '|', indented relative to the slot.
     */
    public class DialectMatrixTests
    {
        const string Database = "mssql";

        public static TheoryData<string, string, string, string, string> Cases => new()
        {
            { "read-where-limit", "read", "table:Foo|where|   and|      id:int:5|limit:int:10",
              "select * from \"Foo\" where \"id\" = @0 order by (select null) offset 0 rows fetch next 10 rows only",
              "@0=5" },
            { "read-columns-offset", "read", "table:Foo|columns|   id:x|   name:x|limit:int:5|offset:int:10",
              "select \"id\",\"name\" from \"Foo\" order by (select null) offset 10 rows fetch next 5 rows only",
              "" },
            { "read-like-or", "read", "table:Foo|where|   or|      name.like:a%|      id.mt:int:1",
              "select * from \"Foo\" where \"name\" like @0 or \"id\" > @1 order by (select null) offset 0 rows fetch next 25 rows only",
              "@0=a%,@1=1" },
            { "read-no-limit", "read", "table:Foo|limit:int:-1",
              "select * from \"Foo\" order by (select null) offset 0 rows",
              "" },
            { "create-returns-id", "create", "table:Foo|values|   name:bar|   n:int:5",
              "insert into \"Foo\" (\"name\", \"n\") values (@0, @1); select scope_identity();",
              "@0=bar,@1=5" },
            { "create-no-id", "create", "return-id:bool:false|table:Foo|values|   name:bar|   n:int:5",
              "insert into \"Foo\" (\"name\", \"n\") values (@0, @1)",
              "@0=bar,@1=5" },
            { "update-where", "update", "table:Foo|values|   name:bar|where|   and|      id:int:5",
              "update \"Foo\" set \"name\" = @v0 where \"id\" = @0",
              "@v0=bar,@0=5" },
            { "delete-where", "delete", "table:Foo|where|   and|      id:int:5",
              "delete from \"Foo\" where \"id\" = @0",
              "@0=5" },
            { "delete-all", "delete", "table:Foo",
              "delete from \"Foo\"",
              "" },
        };

        [Theory]
        [MemberData(nameof(Cases))]
        public void GeneratesTheDialectsSql(string name, string verb, string args, string sql, string parameters)
        {
            var hl = Database + "." + verb + "\n   generate:bool:true\n" +
                string.Join("\n", args.Split('|').Select(x => "   " + x));

            var result = Common.Evaluate(hl).Children.First();

            var actualParameters = string.Join(",", result.Children.Select(x => x.Name + "=" + x.Value));

            Assert.True(sql == (string)result.Value, name + " generated '" + result.Value + "', expected '" + sql + "'");
            Assert.True(parameters == actualParameters, name + " generated parameters '" + actualParameters + "', expected '" + parameters + "'");
        }
    }
}
