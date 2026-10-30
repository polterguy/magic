/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.sqlite.tests
{
    /*
     * Tests the slots against a real SQLite database, as opposed to only testing the SQL they generate.
     */
    public class SqliteRuntimeTests : IDisposable
    {
        readonly Runtime _runtime = new Runtime();

        public void Dispose()
        {
            _runtime.Dispose();
            GC.SuppressFinalize(this);
        }

        const string Create = @"
   sqlite.execute:create table people (id integer primary key autoincrement, name text not null, age integer)";

        [Fact]
        public async Task ExecuteInsertAndSelect()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.execute:insert into people (name, age) values ('Ada', 36)
   sqlite.execute:insert into people (name, age) values ('Bob', 41)
   sqlite.select:select name, age from people order by id");
            var rows = lambda.Children.First().Children.Last().Children.ToList();
            Assert.Equal(2, rows.Count);
            Assert.Equal("Ada", rows[0].Children.First(x => x.Name == "name").Value);
            Assert.Equal(41L, rows[1].Children.First(x => x.Name == "age").Value);
        }

        [Fact]
        public async Task ExecuteReturnsAffectedRows()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.execute:insert into people (name, age) values ('Ada', 36), ('Bob', 41), ('Cy', 20)
   sqlite.execute:update people set age = age + 1 where age > @min
      @min:long:30");
            Assert.Equal(2, lambda.Children.First().Children.Last().Value);
        }

        [Fact]
        public async Task SelectWithParameter()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.execute:insert into people (name, age) values ('Ada', 36), ('Bob', 41)
   sqlite.select:select name from people where age = @age
      @age:long:41");
            var rows = lambda.Children.First().Children.Last().Children.ToList();
            Assert.Single(rows);
            Assert.Equal("Bob", rows[0].Children.First().Value);
        }

        [Fact]
        public async Task SelectMaxLimitsTheRows()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.execute:insert into people (name, age) values ('Ada', 36), ('Bob', 41), ('Cy', 20)
   sqlite.select:select name from people order by id
      max:long:2");
            Assert.Equal(2, lambda.Children.First().Children.Last().Children.Count());
        }

        [Fact]
        public async Task SelectMultipleResultSets()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.execute:insert into people (name, age) values ('Ada', 36)
   sqlite.select:select name from people; select age from people
      multiple-result-sets:bool:true");
            var sets = lambda.Children.First().Children.Last().Children.ToList();
            Assert.Equal(2, sets.Count);
            Assert.Equal("Ada", sets[0].Children.First().Children.First().Value);
            Assert.Equal(36L, sets[1].Children.First().Children.First().Value);
        }

        [Fact]
        public async Task Scalar()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.execute:insert into people (name, age) values ('Ada', 36), ('Bob', 41)
   sqlite.scalar:select count(*) from people");
            Assert.Equal(2L, lambda.Children.First().Children.Last().Value);
        }

        [Fact]
        public async Task TransactionCommit()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.transaction.create
      sqlite.execute:insert into people (name, age) values ('Ada', 36)
      sqlite.transaction.commit
   sqlite.scalar:select count(*) from people");
            Assert.Equal(1L, lambda.Children.First().Children.Last().Value);
        }

        [Fact]
        public async Task TransactionRollback()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.transaction.create
      sqlite.execute:insert into people (name, age) values ('Ada', 36)
      sqlite.transaction.rollback
   sqlite.scalar:select count(*) from people");
            Assert.Equal(0L, lambda.Children.First().Children.Last().Value);
        }

        [Fact]
        public async Task CreateReadUpdateDelete()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.create
      table:people
      values
         name:Ada
         age:long:36
   sqlite.create
      table:people
      values
         name:Bob
         age:long:41
   sqlite.update
      table:people
      values
         age:long:37
      where
         and
            name:Ada
   sqlite.read
      table:people
      columns
         name
         age
      order:id
   sqlite.delete
      table:people
      where
         and
            name:Bob
   sqlite.scalar:select count(*) from people");
            // The first child is the statement creating the table.
            var nodes = lambda.Children.First().Children.Skip(1).ToList();
            Assert.Equal(1L, nodes[0].Value);                     // [sqlite.create] returns the new row's ID.
            Assert.Equal(2L, nodes[1].Value);
            Assert.Equal(1, nodes[2].Value);                      // [sqlite.update] returns the number of rows changed.
            var rows = nodes[3].Children.ToList();
            Assert.Equal(2, rows.Count);
            Assert.Equal(37L, rows[0].Children.First(x => x.Name == "age").Value);
            Assert.Equal(1, nodes[4].Value);                      // [sqlite.delete] returns the number of rows removed.
            Assert.Equal(1L, nodes[5].Value);
        }

        [Fact]
        public async Task CreateWithoutReturningId()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connect:{db}" + Create + @"
   sqlite.create
      table:people
      return-id:bool:false
      values
         name:Ada
   sqlite.scalar:select count(*) from people");
            Assert.Null(lambda.Children.First().Children.Skip(1).First().Value);
            Assert.Equal(1L, lambda.Children.First().Children.Last().Value);
        }

        [Fact]
        public async Task BadSqlThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(() => _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.execute:this is not sql"));
        }

        [Fact]
        public async Task ConnectionsFlush()
        {
            var lambda = await _runtime.EvaluateAsync(@"sqlite.connections.flush");
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public async Task ConnectionFactory()
        {
            var node = await _runtime.SignalAsync(".db-factory.connection.sqlite");
            Assert.IsType<Microsoft.Data.Sqlite.SqliteConnection>(node.Value);
        }

        [Fact]
        public async Task LoadExtensionRequiresFile()
        {
            var ex = await Assert.ThrowsAnyAsync<Exception>(() => _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.load-extension"));
            Assert.Contains("[file]", ex.Message);
        }
    }
}
