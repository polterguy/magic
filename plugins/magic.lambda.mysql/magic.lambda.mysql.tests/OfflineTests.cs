/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Data.Common;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using magic.node;
using magic.data.common.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.mysql.tests
{
    /*
     * Evaluates the slots against a MySQL server that does not exist. The connection is created lazily, the
     * first time a slot needs it, so opening a connection never fails, while every slot that uses it throws
     * as it tries to. The connection string points at a port nobody listens on, to fail at once, and
     * this covers all the code leading up to the first use of the connection without a database.
     */
    public class OfflineTests
    {
        const string ConnectionString = "Server=127.0.0.1;Port=1;Database={database};User Id=magic;Password=magic;Pooling=false;Connection Timeout=1";

        static async Task<Node> EvaluateAsync(string hl)
        {
            var lambda = HyperlambdaParser.Parse(hl);
            await BuildSignaler().SignalAsync("eval", lambda);
            return lambda;
        }

        static ISignaler BuildSignaler()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();

            var settings = new Mock<IDataSettings>();
            settings.SetupGet(x => x.DefaultDatabaseType).Returns("mysql");
            settings
                .Setup(x => x.ConnectionString(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(ConnectionString);
            services.AddSingleton(settings.Object);

            var type1 = typeof(ISlot);
            var type2 = typeof(ISlotAsync);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (type1.IsAssignableFrom(p) || type2.IsAssignableFrom(p)) && !p.IsInterface && !p.IsAbstract)
                .ToList();
            foreach (var idx in types)
            {
                services.AddTransient(idx);
            }
            var provider = new SignalsProvider(types);
            services.AddTransient<ISignalsProvider>(svc => provider);
            return services.BuildServiceProvider().GetService<ISignaler>();
        }

        [Fact]
        public async Task ConnectDoesNotConnect()
        {
            var lambda = await EvaluateAsync(@"mysql.connect:foo");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public async Task ConnectWithoutDatabaseDoesNotConnect()
        {
            var lambda = await EvaluateAsync(@"mysql.connect");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public async Task ConnectWithGenericConnectionStringDoesNotConnect()
        {
            var lambda = await EvaluateAsync(@"mysql.connect:[generic|foo]");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public async Task ConnectEvaluatesItsLambdaWithoutConnecting()
        {
            var lambda = await EvaluateAsync(@"mysql.connect:foo
   .result:ok");
            Assert.Equal("ok", lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public void ConnectionFactoryCreatesUnopenedConnection()
        {
            var node = new Node(".db-factory.connection.mysql");
            BuildSignaler().Signal(".db-factory.connection.mysql", node);
            var connection = Assert.IsType<DbConnection>(node.Value, exactMatch: false);
            Assert.Equal(System.Data.ConnectionState.Closed, connection.State);
            connection.Dispose();
        }

        [Fact]
        public async Task SelectNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.select:select 1"));
        }

        [Fact]
        public async Task SelectWithParameterNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.select:select * from foo where bar = @bar
      @bar:long:5"));
        }

        [Fact]
        public async Task ScalarNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.scalar:select count(*) from foo"));
        }

        [Fact]
        public async Task ExecuteNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.execute:delete from foo where bar = 1"));
        }

        [Fact]
        public async Task CreateNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.create
      table:foo
      values
         bar:howdy
         baz:int:5"));
        }

        [Fact]
        public async Task CreateWithoutReturningIdNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.create
      table:foo
      return-id:bool:false
      values
         bar:howdy"));
        }

        [Fact]
        public async Task ReadNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.read
      table:foo"));
        }

        [Fact]
        public async Task ReadWithArgumentsNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.read
      table:foo
      columns
         bar
         baz
      where
         and
            bar:howdy
      order:baz
      limit:10
      offset:5"));
        }

        [Fact]
        public async Task UpdateNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.update
      table:foo
      values
         bar:howdy
      where
         and
            baz:int:5"));
        }

        [Fact]
        public async Task DeleteNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.delete
      table:foo
      where
         and
            baz:int:5"));
        }

        [Fact]
        public async Task CreateTransactionNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.connect:foo
   mysql.transaction.create
      .result:never"));
        }

        [Fact]
        public async Task CommitWithoutTransactionThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.transaction.commit"));
        }

        [Fact]
        public async Task RollbackWithoutTransactionThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"mysql.transaction.rollback"));
        }
    }
}
