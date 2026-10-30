/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.services;
using magic.signals.contracts;
using magic.data.common.contracts;
using magic.lambda.logging.contracts;
using magic.lambda.logging.services;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.logging.tests
{
    /// <summary>
    /// The database factory the logger asks for, which in the real application is provided by the SQLite plugin.
    /// </summary>
    [Slot(Name = ".db-factory.connection.sqlite")]
    public class TestSqliteFactory : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = new SqliteConnection();
        }
    }

    /*
     * Tests the logger and its slots against a real SQLite database, living in a folder of its own that is
     * deleted again when the test is done.
     */
    public sealed class LoggerTests : IDisposable
    {
        static readonly string[] FirstPage = ["entry 5", "entry 4"];
        static readonly string[] SecondPage = ["entry 3", "entry 2"];

        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-logging-tests-" + Guid.NewGuid().ToString("N"));
        readonly string _connectionString;
        readonly LogSettings _settings = new LogSettings { Level = "debug" };
        readonly ServiceProvider _provider;
        readonly Logger _logger;

        public LoggerTests()
        {
            Directory.CreateDirectory(_folder);
            _connectionString = "Data Source=" + _folder + "/magic.db;Pooling=false";
            Execute(@"create table log_entries (
  id integer not null primary key autoincrement,
  created timestamp not null default current_timestamp,
  type varchar(10) not null collate nocase,
  content text not null collate nocase,
  exception text null collate nocase,
  meta text null
);");

            var dataSettings = new Mock<IDataSettings>();
            dataSettings.SetupGet(x => x.DefaultDatabaseType).Returns("sqlite");
            dataSettings.Setup(x => x.ConnectionString(It.IsAny<string>(), It.IsAny<string>())).Returns(_connectionString);

            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddSingleton(_settings);
            services.AddSingleton(dataSettings.Object);
            services.AddSingleton<Logger>();
            services.AddSingleton<ILogger>(x => x.GetService<Logger>());
            services.AddSingleton<ILogQuery>(x => x.GetService<Logger>());
            var types = new SignalsProvider(AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(x => x.GetTypes())
                .Where(x => (typeof(ISlot).IsAssignableFrom(x) || typeof(ISlotAsync).IsAssignableFrom(x)) && !x.IsInterface && !x.IsAbstract)
                .Select(x =>
                {
                    services.AddTransient(x);
                    return x;
                })
                .ToList());
            services.AddTransient<ISignalsProvider>(svc => types);
            _provider = services.BuildServiceProvider();
            _logger = _provider.GetService<Logger>();
        }

        public void Dispose()
        {
            try
            {
                Directory.Delete(_folder, true);
            }
            catch
            {
                // Best effort, the folder is in the system's temp folder.
            }
        }

        #region [ -- The logger -- ]

        [Theory]
        [InlineData("debug", new[] { "debug", "info", "error", "fatal" })]
        [InlineData("info", new[] { "info", "error", "fatal" })]
        [InlineData("error", new[] { "error", "fatal" })]
        [InlineData("fatal", new[] { "fatal" })]
        [InlineData("off", new string[0])]
        public async Task LevelDecidesWhatIsLogged(string level, string[] logged)
        {
            _settings.Level = level;
            await _logger.DebugAsync("debug");
            await _logger.InfoAsync("info");
            await _logger.ErrorAsync("error");
            await _logger.FatalAsync("fatal");

            var types = (await _logger.QueryAsync(10, null)).Select(x => x.Type).OrderBy(x => x).ToArray();
            Assert.Equal(logged.OrderBy(x => x).ToArray(), types);
        }

        [Fact]
        public async Task LoggingReturnsTheIdOfTheEntryOrNull()
        {
            var first = await _logger.InfoAsync("one");
            var second = await _logger.InfoAsync("two");
            Assert.Equal(1L, Convert.ToInt64(first));
            Assert.Equal(2L, Convert.ToInt64(second));

            _settings.Level = "fatal";
            Assert.Null(await _logger.InfoAsync("three"));
        }

        [Fact]
        public async Task EveryOverloadIsLogged()
        {
            var meta = new System.Collections.Generic.Dictionary<string, string> { ["key"] = "value" };
            await _logger.DebugAsync("d1");
            await _logger.DebugAsync("d2", meta);
            await _logger.InfoAsync("i1");
            await _logger.InfoAsync("i2", meta);
            await _logger.ErrorAsync("e1");
            await _logger.ErrorAsync("e2", meta);
            await _logger.ErrorAsync("e3", "stack");
            await _logger.ErrorAsync("e4", meta, "stack");
            await _logger.FatalAsync("f1");
            await _logger.FatalAsync("f2", meta);
            await _logger.FatalAsync("f3", "stack");
            await _logger.FatalAsync("f4", meta, "stack");

            Assert.Equal(12, await _logger.CountAsync());
            var items = (await _logger.QueryAsync(100, null)).ToDictionary(x => x.Content);
            Assert.Null(items["d1"].Exception);
            Assert.Null(items["d1"].Meta);
            Assert.Equal("value", items["d2"].Meta["key"]);
            Assert.Equal("stack", items["e3"].Exception);
            Assert.Equal("stack", items["f4"].Exception);
            Assert.Equal("value", items["f4"].Meta["key"]);
        }

        [Fact]
        public async Task QueryPagesBackwardsFromAnId()
        {
            for (var idx = 1; idx <= 5; idx++)
            {
                await _logger.InfoAsync("entry " + idx);
            }
            var firstPage = (await _logger.QueryAsync(2, null)).ToList();
            Assert.Equal(FirstPage, firstPage.Select(x => x.Content).ToArray());

            var secondPage = (await _logger.QueryAsync(2, firstPage.Last().Id)).ToList();
            Assert.Equal(SecondPage, secondPage.Select(x => x.Content).ToArray());
        }

        [Fact]
        public async Task QueryAndCountFilterOnContent()
        {
            await _logger.InfoAsync("apple pie");
            await _logger.InfoAsync("apple tart");
            await _logger.InfoAsync("banana split");

            Assert.Equal(2, (await _logger.QueryAsync(10, null, "apple%")).Count());
            Assert.Equal(2, await _logger.CountAsync("apple%"));
            Assert.Equal(3, await _logger.CountAsync());

            // Filter and paging can be combined.
            var items = (await _logger.QueryAsync(10, 3, "apple%")).ToList();
            Assert.Equal(2, items.Count);
            Assert.Empty(await _logger.QueryAsync(10, 1, "apple%"));
        }

        [Fact]
        public async Task QueryReturnsUtcDates()
        {
            await _logger.InfoAsync("one");
            var item = (await _logger.QueryAsync(1, null)).Single();
            Assert.Equal(DateTimeKind.Utc, item.Created.Kind);
            Assert.True(Math.Abs((DateTime.UtcNow - item.Created).TotalMinutes) < 5);
        }

        [Fact]
        public async Task GetReturnsOneEntry()
        {
            var id = await _logger.ErrorAsync("failed", "the stack");
            var item = await _logger.Get(id);
            Assert.Equal("failed", item.Content);
            Assert.Equal("error", item.Type);
            Assert.Equal("the stack", item.Exception);
            Assert.Equal(DateTimeKind.Utc, item.Created.Kind);
        }

        [Fact]
        public async Task GetMissingEntryThrows()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => _logger.Get(12345L));
            Assert.Contains("12345", ex.Message);
        }

        [Fact]
        public async Task TimeshiftCountsExactContentPerDay()
        {
            await _logger.InfoAsync("tick");
            await _logger.InfoAsync("tick");
            await _logger.InfoAsync("tock");

            var buckets = (await _logger.Timeshift("tick")).ToList();
            Assert.Single(buckets);
            Assert.Equal(DateTime.UtcNow.ToString("yyyy-MM-dd"), buckets[0].When);
            Assert.Equal(2L, buckets[0].Count);
        }

        [Fact]
        public void CapabilitiesAreFilteringAndTimeshift()
        {
            var capabilities = _logger.Capabilities();
            Assert.True(capabilities.CanFilter);
            Assert.True(capabilities.CanTimeShift);
        }

        [Theory]
        [InlineData("[1,2,3]", "not a JSON object")]
        [InlineData("{\"a\":{\"b\":1}}", "not a simple value")]
        public async Task MalformedMetaIsReportedWhenRead(string meta, string complaint)
        {
            Execute("insert into log_entries (type, content, meta) values ('info', 'bad', '" + meta + "')");
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => _logger.QueryAsync(10, null));
            Assert.Contains(complaint, ex.Message);
            await Assert.ThrowsAsync<HyperlambdaException>(() => _logger.Get(1L));
        }

        [Fact]
        public async Task MetaOfEveryKindOfSimpleValueIsRead()
        {
            Execute("insert into log_entries (type, content, meta) values ('info', 'ok', '{\"s\":\"text\",\"n\":null,\"t\":true,\"f\":false,\"i\":42}')");
            var meta = (await _logger.QueryAsync(10, null)).Single().Meta;
            Assert.Equal("text", meta["s"]);
            Assert.Null(meta["n"]);
            Assert.Equal("True", meta["t"]);
            Assert.Equal("False", meta["f"]);
            Assert.Equal("42", meta["i"]);
        }

        #endregion

        #region [ -- The slots -- ]

        async Task<Node> EvaluateAsync(string hl)
        {
            var lambda = HyperlambdaParser.Parse(hl);
            await _provider.GetService<ISignaler>().SignalAsync("eval", lambda);
            return lambda;
        }

        [Theory]
        [InlineData("log.debug", "debug")]
        [InlineData("log.info", "info")]
        [InlineData("log.error", "error")]
        [InlineData("log.fatal", "fatal")]
        public async Task LoggingSlotsLogAndReturnTheId(string slot, string type)
        {
            var lambda = await EvaluateAsync(slot + ":The message\n   key:value");
            Assert.Equal(1L, Convert.ToInt64(lambda.Children.First().Value));

            var item = (await _logger.QueryAsync(10, null)).Single();
            Assert.Equal(type, item.Type);
            Assert.Equal("The message", item.Content);
            Assert.Equal("value", item.Meta["key"]);
        }

        [Fact]
        public async Task LoggingSlotConcatenatesItsChildrenWhenGivenNoValue()
        {
            await EvaluateAsync(@"log.info
   .:Hello
   .:-world");
            Assert.Equal("Hello-world", (await _logger.QueryAsync(10, null)).Single().Content);
        }

        [Fact]
        public async Task QuerySlot()
        {
            await _logger.InfoAsync("alpha");
            await _logger.ErrorAsync("beta", "stack");
            await _logger.InfoAsync("gamma", new System.Collections.Generic.Dictionary<string, string> { ["k"] = "v" });

            var all = (await EvaluateAsync("log.query\n   max:int:2")).Children.First().Children.ToList();
            Assert.Equal(2, all.Count);
            Assert.Equal("gamma", all[0].Children.First(x => x.Name == "content").Value);
            Assert.Equal("v", all[0].Children.First(x => x.Name == "meta").Children.Single().Value);

            var filtered = (await EvaluateAsync("log.query:beta")).Children.First().Children.Single();
            Assert.Equal("stack", filtered.Children.First(x => x.Name == "exception").Value);

            var paged = (await EvaluateAsync("log.query\n   from:int:3")).Children.First().Children.ToList();
            Assert.Equal(2, paged.Count);
        }

        [Fact]
        public async Task CountSlot()
        {
            await _logger.InfoAsync("alpha");
            await _logger.InfoAsync("alpha");
            await _logger.InfoAsync("beta");
            Assert.Equal(3L, (await EvaluateAsync("log.count")).Children.First().Value);
            Assert.Equal(2L, (await EvaluateAsync("log.count:alpha")).Children.First().Value);
        }

        [Fact]
        public async Task GetSlot()
        {
            await _logger.InfoAsync("alpha");
            var node = (await EvaluateAsync("log.get:int:1")).Children.First();
            Assert.Equal("alpha", node.Children.First(x => x.Name == "content").Value);
            Assert.Equal("info", node.Children.First(x => x.Name == "type").Value);
        }

        [Fact]
        public async Task TimeshiftSlotReturnsTwoWeeksOfBuckets()
        {
            await _logger.InfoAsync("tick");
            await _logger.InfoAsync("tick");
            var buckets = (await EvaluateAsync("log.timeshift:tick")).Children.First().Children.ToList();
            Assert.True(buckets.Count >= 14);
            Assert.Equal(DateTime.UtcNow.ToString("yyyy-MM-dd"), buckets[0].Children.First(x => x.Name == "when").Value);
            Assert.Equal(2L, buckets[0].Children.First(x => x.Name == "count").Value);
            Assert.Equal(0L, buckets[1].Children.First(x => x.Name == "count").Value);
        }

        [Fact]
        public async Task CapabilitiesSlot()
        {
            var node = (await EvaluateAsync("log.capabilities")).Children.First();
            Assert.True((bool)node.Children.First(x => x.Name == "can-filter").Value);
            Assert.True((bool)node.Children.First(x => x.Name == "can-timeshift").Value);
        }

        #endregion

        #region [ -- Private helper methods -- ]

        void Execute(string sql)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = sql;
                    cmd.ExecuteNonQuery();
                }
            }
        }

        #endregion
    }
}
