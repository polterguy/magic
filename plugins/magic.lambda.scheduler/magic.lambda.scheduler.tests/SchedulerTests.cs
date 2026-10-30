/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Collections.Generic;
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
using magic.lambda.scheduler.utilities;

namespace magic.lambda.scheduler.tests
{
    /// <summary>
    /// The database factory the scheduler asks for, which in the real application is provided by the SQLite plugin.
    /// </summary>
    [Slot(Name = ".db-factory.connection.sqlite")]
    public class TestSqliteFactory : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = new SqliteConnection();
        }
    }

    /// <summary>
    /// Slot recording that it was executed, which is how the tests find out that a task ran.
    /// </summary>
    [Slot(Name = "test.mark")]
    public class TestMark : ISlot
    {
        public static readonly ConcurrentQueue<string> Marks = new();

        public void Signal(ISignaler signaler, Node input)
        {
            Marks.Enqueue(input.GetEx<string>());
        }
    }

    sealed class Creator<T>(Func<T> factory) : IServiceCreator<T> where T : class
    {
        public T Create() => factory();
    }

    /*
     * Tests the scheduler against a real SQLite database, with tasks that are really executed by timers.
     *
     * Notice, the scheduler keeps its timers in a static dictionary, keyed by schedule ID, and every test has a
     * database of its own that starts counting IDs at 1 - so these tests all live in the same class, which xUnit
     * runs one at a time, and every test deletes the tasks it creates, since that disposes their timers.
     */
    public sealed class SchedulerTests : IDisposable
    {
        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-scheduler-tests-" + Guid.NewGuid().ToString("N"));
        readonly string _connectionString;
        readonly Scheduler _scheduler;
        readonly Mock<ILogger> _logger = new();
        readonly string _prefix = Guid.NewGuid().ToString("N").Substring(0, 8);

        public SchedulerTests()
        {
            Directory.CreateDirectory(_folder);
            _connectionString = "Data Source=" + _folder + "/magic.db;Pooling=false";
            Execute(@"
create table tasks (
  id varchar(256) not null primary key collate nocase,
  description text null collate nocase,
  hyperlambda text not null collate nocase,
  created timestamp not null default current_timestamp
);
create table task_due (
  id integer not null primary key autoincrement,
  task varchar(256) not null collate nocase,
  due timestamp not null,
  repeats text null,
  constraint task_due_task_fky foreign key (task) references tasks (id) on delete cascade
);");

            var settings = new Mock<IDataSettings>();
            settings.SetupGet(x => x.DefaultDatabaseType).Returns("sqlite");
            settings.Setup(x => x.ConnectionString(It.IsAny<string>(), It.IsAny<string>())).Returns(_connectionString);

            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
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
            var provider = services.BuildServiceProvider();

            _scheduler = new Scheduler(
                settings.Object,
                new Creator<ISignaler>(() => provider.GetService<ISignaler>()),
                new Creator<ILogger>(() => _logger.Object),
                new Creator<IDataSettings>(() => settings.Object));
        }

        public void Dispose()
        {
            // Deleting the tasks disposes their timers, which the scheduler would otherwise keep around for all other tests.
            foreach (var idx in _scheduler.ListTasksAsync(null, 0, 1000).GetAwaiter().GetResult())
            {
                _scheduler.DeleteTaskAsync(idx.ID).GetAwaiter().GetResult();
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

        #region [ -- Storage -- ]

        [Fact]
        public async Task CreateAndGetTask()
        {
            var due = DateTime.UtcNow.AddDays(10);
            await _scheduler.CreateTaskAsync(new MagicTask(
                "t1",
                "The description",
                "test.mark:one",
                [new Schedule(due), new Schedule(DateTime.UtcNow, "1.hours")]));

            var task = await _scheduler.GetTaskAsync("t1", true);
            Assert.Equal("The description", task.Description);
            Assert.Equal("test.mark:one", task.Hyperlambda);
            Assert.Equal(DateTimeKind.Utc, task.Created.Value.Kind);
            Assert.Equal(2, task.Schedules.Count);
            Assert.Contains(task.Schedules, x => x.Repeats == "1.hours");
            Assert.Contains(task.Schedules, x => x.Repeats == null);
            Assert.All(task.Schedules, x => Assert.True(x.Id > 0));

            // Not asking for them leaves the schedules out.
            Assert.Empty((await _scheduler.GetTaskAsync("t1")).Schedules);
        }

        [Fact]
        public async Task CreateTaskWithoutDescription()
        {
            await _scheduler.CreateTaskAsync(new MagicTask("t1", null, "test.mark:one"));
            var task = await _scheduler.GetTaskAsync("t1");
            Assert.Null(task.Description);
        }

        [Fact]
        public async Task GetMissingTaskThrows()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => _scheduler.GetTaskAsync("nope"));
            Assert.Contains("nope", ex.Message);
        }

        [Fact]
        public async Task ListAndCountWithFilterAndPaging()
        {
            for (var idx = 1; idx <= 5; idx++)
            {
                await _scheduler.CreateTaskAsync(new MagicTask(
                    "task-" + idx,
                    idx % 2 == 0 ? "even" : "odd",
                    "test.mark:x"));
            }
            await _scheduler.CreateTaskAsync(new MagicTask("other", "unrelated", "test.mark:x"));

            Assert.Equal(6, await _scheduler.CountTasksAsync(null));
            Assert.Equal(5, await _scheduler.CountTasksAsync("task-%"));
            Assert.Equal(2, await _scheduler.CountTasksAsync("even"));

            Assert.Equal(6, (await _scheduler.ListTasksAsync(null, 0, 100)).Count);
            Assert.Equal(2, (await _scheduler.ListTasksAsync(null, 0, 2)).Count);
            Assert.Equal(3, (await _scheduler.ListTasksAsync(null, 3, 100)).Count);
            Assert.Equal(3, (await _scheduler.ListTasksAsync("odd", 0, 100)).Count);
            Assert.All(await _scheduler.ListTasksAsync("task-%", 0, 100), x => Assert.StartsWith("task-", x.ID));
        }

        [Fact]
        public async Task UpdateTask()
        {
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "old", "test.mark:old"));
            await _scheduler.UpdateTaskAsync(new MagicTask("t1", "new", "test.mark:new"));
            var task = await _scheduler.GetTaskAsync("t1");
            Assert.Equal("new", task.Description);
            Assert.Equal("test.mark:new", task.Hyperlambda);
        }

        [Fact]
        public async Task UpdateTaskCannotChangeSchedules()
        {
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "old", "test.mark:old"));
            await Assert.ThrowsAsync<HyperlambdaException>(() => _scheduler.UpdateTaskAsync(
                new MagicTask("t1", "new", "test.mark:new", [new Schedule(DateTime.UtcNow.AddDays(1))])));
        }

        [Fact]
        public async Task UpdateMissingTaskThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => _scheduler.UpdateTaskAsync(
                new MagicTask("nope", "new", "test.mark:new")));
        }

        [Fact]
        public async Task DeleteTask()
        {
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:x", [new Schedule(DateTime.UtcNow.AddDays(1))]));
            await _scheduler.DeleteTaskAsync("t1");
            await Assert.ThrowsAsync<HyperlambdaException>(() => _scheduler.GetTaskAsync("t1"));
        }

        [Fact]
        public async Task DeleteMissingTaskThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => _scheduler.DeleteTaskAsync("nope"));
        }

        #endregion

        #region [ -- Scheduling -- ]

        [Fact]
        public async Task ScheduleAndDeleteSchedules()
        {
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:x"));
            var single = await _scheduler.ScheduleTaskAsync("t1", DateTime.UtcNow.AddDays(1));
            var repeating = await _scheduler.ScheduleTaskAsync("t1", PatternFactory.Create("5.minutes"));
            Assert.NotEqual(single, repeating);
            Assert.Equal(2, (await _scheduler.GetTaskAsync("t1", true)).Schedules.Count);

            await _scheduler.DeleteScheduleAsync(single);
            var left = (await _scheduler.GetTaskAsync("t1", true)).Schedules;
            Assert.Single(left);
            Assert.Equal("5.minutes", left.First().Repeats);
        }

        [Fact]
        public async Task ScheduleFarIntoTheFutureIsPostponed()
        {
            // A timer cannot wait more than 45 days, so this one is created as a postponed schedule.
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:" + _prefix + "-far"));
            await _scheduler.ScheduleTaskAsync("t1", DateTime.UtcNow.AddDays(200));
            await Task.Delay(400);
            Assert.DoesNotContain(_prefix + "-far", TestMark.Marks);
        }

        #endregion

        #region [ -- Execution -- ]

        [Fact]
        public async Task ExecuteTask()
        {
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:" + _prefix + "-direct"));
            await _scheduler.ExecuteTaskAsync("t1");
            Assert.Contains(_prefix + "-direct", TestMark.Marks);
        }

        [Fact]
        public async Task ExecuteMissingTaskThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => _scheduler.ExecuteTaskAsync("nope"));
        }

        [Fact]
        public async Task SingleShotScheduleRunsOnceAndIsDeleted()
        {
            var mark = _prefix + "-single";
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:" + mark));
            await _scheduler.ScheduleTaskAsync("t1", DateTime.UtcNow.AddMilliseconds(300));

            await WaitForAsync(() => TestMark.Marks.Contains(mark));
            await WaitForAsync(() => SchedulesOf("t1") == 0);
            Assert.Equal(1, TestMark.Marks.Count(x => x == mark));
        }

        [Fact]
        public async Task RepeatingScheduleRunsAgainAndMovesItsDueDate()
        {
            var mark = _prefix + "-repeat";
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:" + mark));
            var id = await _scheduler.ScheduleTaskAsync("t1", PatternFactory.Create("1.seconds"));

            await WaitForAsync(() => TestMark.Marks.Count(x => x == mark) >= 2, 15);
            Assert.Equal(1, SchedulesOf("t1"));
            await _scheduler.DeleteScheduleAsync(id);
            Assert.Equal(0, SchedulesOf("t1"));
        }

        [Fact]
        public async Task StartCreatesTimersForStoredSchedules()
        {
            var mark = _prefix + "-start";
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:" + mark));

            // Putting a schedule into the database, bypassing the scheduler, as it is after a restart of the application.
            Execute("insert into task_due (task, due, repeats) values ('t1', '" +
                DateTime.UtcNow.AddMilliseconds(300).ToString("yyyy-MM-dd HH:mm:ss.fff") + "', null)");
            Assert.DoesNotContain(mark, TestMark.Marks);

            await _scheduler.StartAsync();
            await WaitForAsync(() => TestMark.Marks.Contains(mark));
            Assert.Contains(mark, TestMark.Marks);
        }

        [Fact]
        public async Task StartCreatesTimersForRepeatingSchedules()
        {
            var mark = _prefix + "-start-repeat";
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "test.mark:" + mark));
            Execute("insert into task_due (task, due, repeats) values ('t1', '" +
                DateTime.UtcNow.AddMilliseconds(300).ToString("yyyy-MM-dd HH:mm:ss.fff") + "', '1.minutes')");

            await _scheduler.StartAsync();
            await WaitForAsync(() => TestMark.Marks.Contains(mark));
            await WaitForAsync(() => SchedulesOf("t1") == 1);

            // A repeating schedule is kept, as opposed to a single shot one, which is deleted once it has run.
            Assert.Equal(1, SchedulesOf("t1"));
        }

        [Fact]
        public async Task FailingTaskIsLoggedAndTheScheduleStillCleanedUp()
        {
            await _scheduler.CreateTaskAsync(new MagicTask("t1", "d", "throw:This task fails"));
            await _scheduler.ScheduleTaskAsync("t1", DateTime.UtcNow.AddMilliseconds(300));

            await WaitForAsync(() => _logger.Invocations.Count > 0);
            await WaitForAsync(() => SchedulesOf("t1") == 0);
            Assert.NotEmpty(_logger.Invocations);
            Assert.Equal(0, SchedulesOf("t1"));
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

        int SchedulesOf(string task)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = "select count(*) from task_due where task = '" + task + "'";
                    return Convert.ToInt32(cmd.ExecuteScalar());
                }
            }
        }

        static async Task WaitForAsync(Func<bool> condition, int seconds = 10)
        {
            var deadline = DateTime.UtcNow.AddSeconds(seconds);
            while (!condition())
            {
                if (DateTime.UtcNow > deadline)
                    throw new TimeoutException("The condition was not met in time");
                await Task.Delay(50);
            }
        }

        #endregion
    }
}
