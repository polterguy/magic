/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class MySQLTests
    {
        [Fact]
        public void SelectSQL_01()
        {
            var lambda = Common.Evaluate(@"mysql.select
   only-sql:bool:true
   table:SomeTable");
            Assert.Empty(lambda.Children.First().Children);
            Assert.Equal("select * from `SomeTable`", lambda.Children.First().Value);
        }

        [Fact]
        public void SelectSQL_02()
        {
            var lambda = Common.Evaluate(@"mysql.select
   only-sql:bool:true
   table:SomeTable
   columns
      Foo:bar
      Howdy:World
   limit:10
   offset:100");
            Assert.Empty(lambda.Children.First().Children);
            Assert.Equal("select `Foo`,`Howdy` from `SomeTable` limit 10 offset 100", lambda.Children.First().Value);
        }

        [Fact]
        public void SelectSQL_03()
        {
            var lambda = Common.Evaluate(@"mysql.select
   only-sql:bool:true
   table:SomeTable
   where
      and
         jo-dude:int:5
         foo-bar:howdy");
            Assert.Equal("select * from `SomeTable` where `jo-dude` = @0 and `foo-bar` = @1", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(5, lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("howdy", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void SelectSQL_04()
        {
            var lambda = Common.Evaluate(@"mysql.select
   only-sql:bool:true
   table:SomeTable
   where
      or
         jo-dude:int:5
         foo:bar");
            Assert.Equal("select * from `SomeTable` where `jo-dude` = @0 or `foo` = @1", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(5, lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void SelectSQL_05()
        {
            var lambda = Common.Evaluate(@"mysql.select
   only-sql:bool:true
   table:SomeTable
   where
      and
         or
            jo-dude:int:5
            foo:bar
         or
            jo:decimal:5
            ho:bar");
            Assert.Equal("select * from `SomeTable` where (`jo-dude` = @0 or `foo` = @1) and (`jo` = @2 or `ho` = @3)", lambda.Children.First().Value);
            Assert.Equal(4, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(5, lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar", lambda.Children.First().Children.Skip(1).First().Value);
            Assert.Equal("@2", lambda.Children.First().Children.Skip(2).First().Name);
            Assert.Equal(5M, lambda.Children.First().Children.Skip(2).First().Value);
            Assert.Equal("@3", lambda.Children.First().Children.Skip(3).First().Name);
            Assert.Equal("bar", lambda.Children.First().Children.Skip(3).First().Value);
        }
    }
}
