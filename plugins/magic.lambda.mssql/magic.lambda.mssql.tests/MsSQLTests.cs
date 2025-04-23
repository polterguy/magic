/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;

namespace magic.lambda.mssql.tests
{
    public class MsSQLTests
    {
        [Fact]
        public void SelectSQL_01()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable");
            Assert.Empty(lambda.Children.First().Children);
            Assert.Equal("select * from \"SomeTable\" order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
        }

        [Fact]
        public void SelectSQL_02()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   columns
      Foo:bar
      Howdy:World
   limit:10
   offset:100");
            Assert.Empty(lambda.Children.First().Children);
            Assert.Equal("select \"Foo\",\"Howdy\" from \"SomeTable\" order by (select null) offset 100 rows fetch next 10 rows only", lambda.Children.First().Value);
        }

        [Fact]
        public void SelectSQL_03()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   where
      and
         jo-dude:int:5
         foo-bar.like:howdy%");
            Assert.Equal("select * from \"SomeTable\" where \"jo-dude\" = @0 and \"foo-bar\" like @1 order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(5, lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("howdy%", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void SelectSQL_04()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   where
      or
         jo-dude:int:5
         foo:bar");
            Assert.Equal("select * from \"SomeTable\" where \"jo-dude\" = @0 or \"foo\" = @1 order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(5, lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void SelectSQL_05()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   where
      and
         or
            jo-dude:int:5
            foo:bar
         or
            jo:decimal:5
            ho:bar");
            Assert.Equal("select * from \"SomeTable\" where (\"jo-dude\" = @0 or \"foo\" = @1) and (\"jo\" = @2 or \"ho\" = @3) order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
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

        [Fact]
        public void SelectSQL_06()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   order:foo");
            Assert.Equal("select * from \"SomeTable\" order by \"foo\" asc offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void SelectSQL_07()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   order:foo
   direction:desc");
            Assert.Equal("select * from \"SomeTable\" order by \"foo\" desc offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void SelectSQL_08()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   order:foo
   direction:asc");
            Assert.Equal("select * from \"SomeTable\" order by \"foo\" asc offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void SelectSQL_09()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   where
      and
         id.mt:int:3");
            Assert.Equal("select * from \"SomeTable\" where \"id\" > @0 order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(3, lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public void SelectSQL_10()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   where
      and
         id.mt:int:3");
            Assert.Equal("select * from \"SomeTable\" where \"id\" > @0 order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(3, lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public void SelectSQL_12()
        {
            var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   columns
      Foo
      Howdy
   where
      and
         Foo.in
            .:long:5
            .:long:7");
            Assert.Equal("select \"Foo\",\"Howdy\" from \"SomeTable\" where \"Foo\" in (@0,@1) order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(5L, lambda.Children.First().Children.First().Value);
            Assert.Equal(7L, lambda.Children.First().Children.Skip(1).First().Value);
        }

		[Fact]
		public void SelectSQL_13()
		{
			var lambda = Common.Evaluate(@"mssql.read
   generate:bool:true
   table:SomeTable
   columns
      Foo
      Howdy
   where
      and
         Foo.in
            :int:5
            :int:7");
			Assert.Equal("select \"Foo\",\"Howdy\" from \"SomeTable\" where \"Foo\" in (@0,@1) order by (select null) offset 0 rows fetch next 25 rows only", lambda.Children.First().Value);
			Assert.Equal(2, lambda.Children.First().Children.Count());
			Assert.Equal("@0", lambda.Children.First().Children.First().Name);
			Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
			Assert.Equal(5, lambda.Children.First().Children.First().Value);
			Assert.Equal(7, lambda.Children.First().Children.Skip(1).First().Value);
		}

		[Fact]
        public void DeleteSQL_01()
        {
            var lambda = Common.Evaluate(@"mssql.delete
   generate:bool:true
   table:SomeTable");
            Assert.Empty(lambda.Children.First().Children);
            Assert.Equal("delete from \"SomeTable\"", lambda.Children.First().Value);
        }

        [Fact]
        public void DeleteSQL_02()
        {
            var lambda = Common.Evaluate(@"mssql.delete
   generate:bool:true
   table:SomeTable
   where
      and
         jo-dude:int:5
         foo-bar.like:howdy%");
            Assert.Equal("delete from \"SomeTable\" where \"jo-dude\" = @0 and \"foo-bar\" like @1", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal(5, lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("howdy%", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void InsertSQL_01()
        {
            var lambda = Common.Evaluate(@"mssql.create
   generate:bool:true
   table:SomeTable
   values
      foo1:bar1
      foo2:int:5");
            Assert.Equal("insert into \"SomeTable\" (\"foo1\", \"foo2\") values (@0, @1); select scope_identity();", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(5, lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void InsertSQL_02()
        {
            var lambda = Common.Evaluate(@"mssql.create
   generate:bool:true
   table:SomeTable
   values
      foo1:bar1
      foo2:int:5");
            Assert.Equal("insert into \"SomeTable\" (\"foo1\", \"foo2\") values (@0, @1); select scope_identity();", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("@1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(5, lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void InsertSQL_03()
        {
            var lambda = Common.Evaluate(@"mssql.create
   generate:bool:true
   return-id:false
   table:SomeTable
   values
      foo1:bar1
      foo2");
            Assert.Equal("insert into \"SomeTable\" (\"foo1\", \"foo2\") values (@0, null)", lambda.Children.First().Value);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public void InsertSQL_04()
        {
            var lambda = Common.Evaluate(@"mssql.create
   generate:bool:true
   table:SomeTable
   values
      foo1:bar1
      foo2");
            Assert.Equal("insert into \"SomeTable\" (\"foo1\", \"foo2\") values (@0, null); select scope_identity();", lambda.Children.First().Value);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("@0", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public void UpdateSQL_01()
        {
            var lambda = Common.Evaluate(@"mssql.update
   generate:bool:true
   table:SomeTable
   where
      and
         id:int:1
   values
      foo1:bar1
      foo2:int:5");
            Assert.Equal("update \"SomeTable\" set \"foo1\" = @v0, \"foo2\" = @v1 where \"id\" = @0", lambda.Children.First().Value);
            Assert.Equal(3, lambda.Children.First().Children.Count());
            Assert.Equal("@v0", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("@v1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(5, lambda.Children.First().Children.Skip(1).First().Value);
            Assert.Equal("@0", lambda.Children.First().Children.Skip(2).First().Name);
            Assert.Equal(1, lambda.Children.First().Children.Skip(2).First().Value);
        }

        [Fact]
        public void UpdateSQL_02()
        {
            var lambda = Common.Evaluate(@"mssql.update
   generate:bool:true
   table:SomeTable
   where
      and
         id:int:1
   values
      foo1:bar1
      foo2:int:5");
            Assert.Equal("update \"SomeTable\" set \"foo1\" = @v0, \"foo2\" = @v1 where \"id\" = @0", lambda.Children.First().Value);
            Assert.Equal(3, lambda.Children.First().Children.Count());
            Assert.Equal("@v0", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("@v1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(5, lambda.Children.First().Children.Skip(1).First().Value);
            Assert.Equal("@0", lambda.Children.First().Children.Skip(2).First().Name);
            Assert.Equal(1, lambda.Children.First().Children.Skip(2).First().Value);
        }

        [Fact]
        public void UpdateSQL_04()
        {
            var lambda = Common.Evaluate(@"mssql.update
   generate:bool:true
   table:SomeTable
   where
      and
         id:int:1
   values
      foo1:bar1
      foo2");
            Assert.Equal("update \"SomeTable\" set \"foo1\" = @v0, \"foo2\" = null where \"id\" = @0", lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("@v0", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("@0", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(1, lambda.Children.First().Children.Skip(1).First().Value);
        }
    }
}
