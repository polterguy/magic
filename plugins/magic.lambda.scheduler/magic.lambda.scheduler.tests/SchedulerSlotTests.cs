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
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.services;
using magic.signals.contracts;
using magic.data.common.contracts;
using magic.lambda.logging.contracts;
using magic.lambda.scheduler.services;
using magic.lambda.scheduler.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.scheduler.tests
{
    /*
     * The tasks.* slots, which are what Hyperlambda uses to manage tasks and schedules, against the real
     * scheduler and a real SQLite database. In the same collection as the scheduler tests, since the scheduler
     * keeps its timers in a static dictionary.
     */
    [Collection("scheduler")]
    public sealed class SchedulerSlotTests : IDisposable
    {
        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-scheduler-slots-" + Guid.NewGuid().ToString("N"));
        readonly string _connectionString;
        readonly ServiceProvider _provider;

        public SchedulerSlotTests()
        {
            Directory.CreateDirectory(_folder);
            _connectionString = "Data Source=" + _folder + "/magic.db;Pooling=false";
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                using var cmd = connection.CreateCommand();
                cmd.CommandText = @"
create table tasks (id varchar(256) not null primary key collate nocase, description text null collate nocase, hyperlambda text not null collate nocase, created timestamp not null default current_timestamp);
create table task_due (id integer not null primary key autoincrement, task varchar(256) not null collate nocase, due timestamp not null, repeats text null, constraint task_due_task_fky foreign key (task) references tasks (id) on delete cascade);";
                cmd.ExecuteNonQuery();
            }

            var settings = new Mock<IDataSettings>();
            settings.SetupGet(x => x.DefaultDatabaseType).Returns("sqlite");
            settings.Setup(x => x.ConnectionString(It.IsAny<string>(), It.IsAny<string>())).Returns(_connectionString);

            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddSingleton(settings.Object);
            services.AddSingleton(new Mock<ILogger>().Object);
            services.AddTransient<IServiceCreator<ISignaler>>(sp => new Creator<ISignaler>(() => sp.GetService<ISignaler>()));
            services.AddTransient<IServiceCreator<ILogger>>(sp => new Creator<ILogger>(() => sp.GetService<ILogger>()));
            services.AddTransient<IServiceCreator<IDataSettings>>(sp => new Creator<IDataSettings>(() => sp.GetService<IDataSettings>()));
            services.AddSingleton<Scheduler>();
            services.AddSingleton<ITaskScheduler>(sp => sp.GetService<Scheduler>());
            services.AddSingleton<ITaskStorage>(sp => sp.GetService<Scheduler>());
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
        }

        public void Dispose()
        {
            // Deleting the tasks disposes their timers, which the scheduler would otherwise keep around for all other tests.
            var storage = _provider.GetService<ITaskStorage>();
            foreach (var idx in storage.ListTasksAsync(null, 0, 1000).GetAwaiter().GetResult())
            {
                storage.DeleteTaskAsync(idx.ID).GetAwaiter().GetResult();
            }
            try
            {
                Directory.Delete(_folder, true);
            }
            catch
            {
                // Best effort, the folder is in the system's temp folder.
            }
        }

        async Task<Node> EvaluateAsync(string hl)
        {
            var lambda = HyperlambdaParser.Parse(hl);
            await _provider.GetService<ISignaler>().SignalAsync("eval", lambda);
            return lambda;
        }

        const string Create = @"tasks.create:one
   .lambda
      test.mark:from-slot
";

        [Fact]
        public async Task CreateAndGet()
        {
            var lambda = await EvaluateAsync(@"tasks.create:the-task
   description:The description
   .lambda
      test.mark:hello
tasks.get:the-task");
            var task = lambda.Children.Last();
            Assert.Equal("The description", task.Children.First(x => x.Name == "description").Value);
            Assert.IsType<DateTime>(task.Children.First(x => x.Name == "created").Value);
            Assert.Contains("test.mark:hello", task.Children.First(x => x.Name == "hyperlambda").Get<string>());
        }

        [Fact]
        public async Task IdCanBeAnArgumentInsteadOfTheValue()
        {
            var lambda = await EvaluateAsync(@"tasks.create
   id:by-argument
   .lambda
      test.mark:x
tasks.get:by-argument");
            Assert.Contains("test.mark:x", lambda.Children.Last().Children.First(x => x.Name == "hyperlambda").Get<string>());
        }

        [Theory]
        [InlineData("Upper")]
        [InlineData("with space")]
        [InlineData("slash/name")]
        public async Task IdWithIllegalCharactersIsRejected(string id)
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.create:\"" + id + "\"\n   .lambda\n      test.mark:x"));
            Assert.Contains("ID of task", ex.Message);
        }

        [Fact]
        public async Task CreateWithoutAnIdOrALambdaIsRejected()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.create\n   .lambda\n      test.mark:x"));
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.create:one"));
            Assert.Contains("[.lambda]", ex.Message);
        }

        [Fact]
        public async Task CreateWithSchedules()
        {
            var due = DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss");
            var lambda = await EvaluateAsync(@"tasks.create:scheduled
   .lambda
      test.mark:x
   due:date:""" + due + @"""
   repeats:5.minutes
tasks.get:scheduled
   schedules:bool:true");
            var schedules = lambda.Children.Last().Children.First(x => x.Name == "schedules").Children.ToList();
            Assert.Equal(2, schedules.Count);
            Assert.Single(schedules, x => x.Children.Any(y => y.Name == "repeats" && (string)y.Value == "5.minutes"));
            Assert.All(schedules, x => Assert.IsType<DateTime>(x.Children.First(y => y.Name == "due").Value));
        }

        [Fact]
        public async Task GetMissingTaskThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.get:nope"));
        }

        [Fact]
        public async Task ListWithFilterAndPaging()
        {
            var lambda = await EvaluateAsync(@"tasks.create:alpha-1
   description:First
   .lambda
      test.mark:x
tasks.create:alpha-2
   .lambda
      test.mark:x
tasks.create:beta-1
   .lambda
      test.mark:x
tasks.list
tasks.list:alpha
tasks.list:alpha-2
tasks.list
   limit:int:1
tasks.list
   offset:int:2
tasks.list:%-1");
            var results = lambda.Children.Skip(3).Select(x => x.Children.ToList()).ToList();
            Assert.Equal(3, results[0].Count);
            Assert.Equal(2, results[1].Count);                   // The filter gets a trailing % unless it has one.
            Assert.Single(results[2]);
            Assert.Single(results[3]);
            Assert.Single(results[4]);
            Assert.Equal(2, results[5].Count);
            static bool IsTask(Node node, string id) => node.Children.Any(y => y.Name == "id" && y.Value as string == id);
            Assert.Equal("First", results[1].First(x => IsTask(x, "alpha-1")).Children.First(x => x.Name == "description").Value);
            Assert.DoesNotContain(results[1].First(x => IsTask(x, "alpha-2")).Children, x => x.Name == "description");
        }

        [Fact]
        public async Task CountWithAndWithoutFilter()
        {
            var lambda = await EvaluateAsync(@"tasks.create:a-1
   .lambda
      test.mark:x
tasks.create:a-2
   .lambda
      test.mark:x
tasks.create:b-1
   .lambda
      test.mark:x
tasks.count
tasks.count:a-%");
            Assert.Equal(3, lambda.Children.Skip(3).First().Value);
            Assert.Equal(2, lambda.Children.Skip(4).First().Value);
        }

        [Fact]
        public async Task Update()
        {
            var lambda = await EvaluateAsync(@"tasks.create:upd
   description:Old
   .lambda
      test.mark:old
tasks.update:upd
   description:New
   .lambda
      test.mark:new
tasks.get:upd");
            var task = lambda.Children.Last();
            Assert.Equal("New", task.Children.First(x => x.Name == "description").Value);
            Assert.Contains("test.mark:new", task.Children.First(x => x.Name == "hyperlambda").Get<string>());
        }

        [Fact]
        public async Task Delete()
        {
            await EvaluateAsync(Create + "tasks.delete:one");
            await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.get:one"));
            await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.delete:one"));
        }

        [Fact]
        public async Task Execute()
        {
            var mark = "slot-" + Guid.NewGuid().ToString("N");
            await EvaluateAsync("tasks.create:runme\n   .lambda\n      test.mark:" + mark + "\ntasks.execute:runme");
            Assert.Contains(mark, TestMark.Marks);
        }

        [Fact]
        public async Task ScheduleWithDueDateAndDelete()
        {
            var due = DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss");
            var lambda = await EvaluateAsync(Create + @"tasks.schedule:one
   due:date:""" + due + @"""
tasks.schedule:one
   repeats:1.hours");
            var first = Convert.ToInt32(lambda.Children.Skip(1).First().Value);
            var second = Convert.ToInt32(lambda.Children.Skip(2).First().Value);
            Assert.NotEqual(first, second);

            await EvaluateAsync("tasks.schedule.delete:" + first);
            Assert.Equal(1, SchedulesOf("one"));
        }

        [Fact]
        public async Task ScheduleWithoutDueOrRepeatsIsRejected()
        {
            await EvaluateAsync(Create);
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.schedule:one"));
            Assert.Contains("[due] or [repeats]", ex.Message);
        }

        [Fact]
        public async Task ScheduleInThePastIsRejected()
        {
            await EvaluateAsync(Create);
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => EvaluateAsync("tasks.schedule:one\n   due:date:\"2001-01-01T00:00:00\""));
            Assert.Contains("past", ex.Message);
        }

        int SchedulesOf(string task)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "select count(*) from task_due where task = '" + task + "'";
            return Convert.ToInt32(cmd.ExecuteScalar());
        }
    }
}
