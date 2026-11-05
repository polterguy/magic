/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using magic.node;
using magic.data.common.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.odbc.tests
{
    /*
     * Evaluates the slots against an ODBC data source that does not exist. The connection is created lazily,
     * the first time a slot needs it, so opening a connection never fails, while every slot that uses it
     * throws as it tries to. This covers all the code leading up to the first use of the connection, without
     * needing a driver or a database.
     */
    public class OfflineTests
    {
        const string ConnectionString = "DSN=magic-tests-no-such-data-source";

        static async Task<Node> EvaluateAsync(string hl)
        {
            var lambda = HyperlambdaParser.Parse(hl);
            await BuildSignaler().SignalAsync("eval", lambda);
            return lambda;
        }

        static ISignaler BuildSignaler()
        {
            _ = typeof(magic.lambda.odbc.Connect);
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();

            var settings = new Mock<IDataSettings>();
            settings.SetupGet(x => x.DefaultDatabaseType).Returns("odbc");
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
            var lambda = await EvaluateAsync(@"odbc.connect:foo");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public async Task ConnectWithoutValueDoesNotConnect()
        {
            var lambda = await EvaluateAsync(@"odbc.connect");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public async Task ConnectWithGenericConnectionStringDoesNotConnect()
        {
            var lambda = await EvaluateAsync(@"odbc.connect:[generic|foo]");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public async Task ConnectEvaluatesItsLambdaWithoutConnecting()
        {
            var lambda = await EvaluateAsync(@"odbc.connect:foo
   .result:ok");
            Assert.Equal("ok", lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public async Task SelectNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.connect:foo
   odbc.select:select 1"));
        }

        [Fact]
        public async Task SelectWithParameterNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.connect:foo
   odbc.select:select * from foo where bar = @bar
      @bar:long:5"));
        }

        [Fact]
        public async Task ScalarNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.connect:foo
   odbc.scalar:select count(*) from foo"));
        }

        [Fact]
        public async Task ExecuteNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.connect:foo
   odbc.execute:delete from foo where bar = 1"));
        }

        [Fact]
        public async Task TransactionCreateNeedsTheConnection()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.connect:foo
   odbc.transaction.create
      odbc.execute:delete from foo"));
        }

        [Fact]
        public async Task CommitWithoutTransactionThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.connect:foo
   odbc.transaction.commit"));
        }

        [Fact]
        public async Task RollbackWithoutTransactionThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.connect:foo
   odbc.transaction.rollback"));
        }

        [Fact]
        public async Task SlotsWithoutConnectionThrow()
        {
            await Assert.ThrowsAnyAsync<Exception>(async () => await EvaluateAsync(@"odbc.select:select 1"));
        }
    }
}
