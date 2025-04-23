/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.data.common.tests
{
    public class HyperlambdaTests
    {
        [Fact]
        public void CrudCreate_Throws()
        {
            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"data.create
   generate:true
   database-type:foo-bar
   table:table1
   values
      field1:value1"));
            Assert.Contains("[foo-bar.create]", exception.Message);
        }

        [Fact]
        public void CreateSingleValue()
        {
            var lambda = Common.Evaluate(@"sql.create
   table:table1
   values
      field1:value1");
            Assert.Equal("insert into 'table1' ('field1') values (@0)", lambda.Children.First().Get<string>());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal("value1", lambda.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void ReadAll()
        {
            var lambda = Common.Evaluate(@"sql.read
   table:table1");
            Assert.Equal("select * from 'table1' limit 25", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void UpdateSingleValue()
        {
            var lambda = Common.Evaluate(@"sql.update
   table:table1
   values
      field1:value1");
            Assert.Equal("update 'table1' set 'field1' = @v0", lambda.Children.First().Get<string>());
            Assert.Equal("@v0", lambda.Children.First().Children.First().Name);
            Assert.Equal("value1", lambda.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void DeleteAllFromTable()
        {
            var lambda = Common.Evaluate(@"sql.delete
   table:table1");
            Assert.Equal("delete from 'table1'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadWithInnerJoinOneField()
        {
            var lambda = Common.Evaluate(@"sql.read
   limit:-1
   table:table1
      join:table2
         as:t2
         type:inner
         on
            and
               field1:t2.field2");
            Assert.Equal("select * from 'table1' inner join 'table2' t2 on 'field1' = 't2'.'field2'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadWithNullCondition()
        {
            var lambda = Common.Evaluate(@"
sql.read
   limit:-1
   table:table1
   where
      and
         foo1.eq
         foo2.neq
         foo3
");
            Assert.Equal("select * from 'table1' where 'foo1' is null and 'foo2' is not null and 'foo3' is null", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadFromMultipleTables()
        {
            var lambda = Common.Evaluate(@"
sql.read
   limit:-1
   table:table1
   table:table2
");
            Assert.Equal("select * from 'table1', 'table2'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadWithAlias()
        {
            var lambda = Common.Evaluate(@"
sql.read
   limit:-1
   table:table1
      as:t1
");
            Assert.Equal("select * from 'table1' t1", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadWithInnerJoinMultipleFields()
        {
            var lambda = Common.Evaluate(@"sql.read
   limit:-1
   table:table1
      join:table2
         type:inner
         on
            and
               field1:field2
               field3:field4");
            Assert.Equal("select * from 'table1' inner join 'table2' on 'field1' = 'field2' and 'field3' = 'field4'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadWithNestedInnerRightJoins()
        {
            var lambda = Common.Evaluate(@"sql.read
   limit:-1
   table:table1
      join:table2
         type:inner
         on
            and
               field1.eq:field2
         join:table3
            type:right
            on
               and
                  field3.eq:field4");
            Assert.Equal("select * from 'table1' inner join 'table2' on 'field1' = 'field2' right join 'table3' on 'field3' = 'field4'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadWithNestedFullLeftJoins()
        {
            var lambda = Common.Evaluate(@"sql.read
   limit:-1
   table:table1
      join:table2
         type:full
         on
            and
               field1.eq:field2
         join:table3
            type:left
            on
               and
                  field3.eq:field4");
            Assert.Equal("select * from 'table1' full join 'table2' on 'field1' = 'field2' left join 'table3' on 'field3' = 'field4'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadColumnAndTableAliased()
        {
            var lambda = Common.Evaluate(@"sql.read
   table:table1
   columns
      table1.foo1
         as:howdy
      table1.foo2
         as:world");
            Assert.Equal("select 'table1'.'foo1' as 'howdy','table1'.'foo2' as 'world' from 'table1' limit 25", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadGroupBySingleField()
        {
            var lambda = Common.Evaluate(@"sql.read
   table:table1
   limit:-1
   columns
      count(*)
   group
      foo1");
            Assert.Equal("select count(*) from 'table1' group by 'foo1'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadGroupByAggregate()
        {
            var lambda = Common.Evaluate(@"sql.read
   table:table1
   limit:-1
   columns
      count(*)
   group
      count(*)");
            Assert.Equal("select count(*) from 'table1' group by count(*)", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadGroupByMultipleFields()
        {
            var lambda = Common.Evaluate(@"sql.read
   table:table1
   limit:-1
   columns
      count(*)
   group
      foo1
      foo2");
            Assert.Equal("select count(*) from 'table1' group by 'foo1','foo2'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadGroupByTablePrefix()
        {
            var lambda = Common.Evaluate(@"sql.read
   table:table1
   limit:-1
   columns
      count(*)
   group
      table1.foo1");
            Assert.Equal("select count(*) from 'table1' group by 'table1'.'foo1'", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void ReadMultipleGroupBy_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"sql.read
   table:table1
   limit:-1
   columns
      count(*)
   group
      foo1
   group
      foo2"));
        }
    }
}
