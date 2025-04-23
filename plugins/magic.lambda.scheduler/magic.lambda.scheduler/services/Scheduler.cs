/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using System.Threading;
using System.Data.Common;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.data.common.contracts;
using magic.lambda.logging.contracts;
using magic.lambda.scheduler.contracts;
using magic.lambda.scheduler.utilities;
using magic.lambda.scheduler.services.internals;

namespace magic.lambda.scheduler.services
{
    /// <inheritdoc />
    public sealed class Scheduler : ITaskScheduler, ITaskStorage
    {
        readonly ISignaler _signaler;
        readonly IDataSettings _settings;
        readonly IServiceCreator<ISignaler> _signalCreator;
        readonly IServiceCreator<ILogger> _loggerCreator;
        readonly IServiceCreator<IDataSettings> _settingsFactory;
        static readonly Dictionary<int, TaskScheduleWrapper> _schedules = [];
        static readonly object _dictionarySemaphore = new();
        static readonly SemaphoreSlim _executeSemaphore = new(8, 8);

        /// <summary>
        /// Creates a new instance of the task scheduler, allowing you to create, edit, delete, and
        /// update tasks in your system - In addition to letting you schedule tasks.
        /// </summary>
        /// <param name="signaler">Needed to signal slots.</param>
        /// <param name="configuration">Needed to verify scheduling is turned on.</param>
        /// <param name="settings">Configuration object.</param>
        /// <param name="signalCreator">Needed to be able to create an ISignaler instance during execution of scheduled tasks.</param>
        /// <param name="loggerCreator">Needed to be able to log errors occurring as tasks are executed.</param>
        /// <param name="settingsCreator">Needed to be able to create an IDataSettings instance during execution of scheduled tasks.</param>
        public Scheduler(
            ISignaler signaler,
            IDataSettings settings,
            IServiceCreator<ISignaler> signalCreator,
            IServiceCreator<ILogger> loggerCreator,
            IServiceCreator<IDataSettings> settingsCreator)
        {
            _signaler = signaler;
            _settings = settings;
            _signalCreator = signalCreator;
            _settingsFactory = settingsCreator;
            _loggerCreator = loggerCreator;
        }

        #region [ -- Interface implementation for ITaskStorage -- ]

        /// <inheritdoc />
        public async Task CreateTaskAsync(MagicTask task)
        {
            await DatabaseHelper.ConnectAsync(_signaler, _settings, async (connection) =>
            {
                var sqlBuilder = new StringBuilder();
                sqlBuilder
                    .Append("insert into tasks (id, hyperlambda")
                    .Append(task.Description == null ? ")" : ", description)")
                    .Append(" values (@id, @hyperlambda")
                    .Append(task.Description == null ? ")" : ", @description)");

                await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sqlBuilder.ToString(),
                    async (cmd) =>
                {
                    DatabaseHelper.AddParameter(cmd, "@id", task.ID, _settings.DefaultDatabaseType);
                    DatabaseHelper.AddParameter(cmd, "@hyperlambda", task.Hyperlambda, _settings.DefaultDatabaseType);
                    if (task.Description != null)
                        DatabaseHelper.AddParameter(cmd, "@description", task.Description, _settings.DefaultDatabaseType);
                    await cmd.ExecuteNonQueryAsync();
                });

                foreach (var idx in task.Schedules.Where(x => x.Repeats != null))
                {
                    await ScheduleTaskAsync(
                        connection,
                        task.ID,
                        PatternFactory.Create(idx.Repeats));
                }
                foreach (var idx in task.Schedules.Where(x => x.Repeats == null))
                {
                    await ScheduleTaskAsync(
                        connection,
                        task.ID,
                        idx.Due);
                }
            });
        }

        /// <inheritdoc />
        public async Task<IList<MagicTask>> ListTasksAsync(
            string filter,
            long offset,
            long limit)
        {
            return await DatabaseHelper.ConnectAsync(
                _signaler,
                _settings,
                async (connection) =>
            {
                var sqlBuilder = new StringBuilder();
                sqlBuilder
                    .Append("select id, description, hyperlambda, created from tasks")
                    .Append(string.IsNullOrEmpty(filter) ? "" : " where id like @filter or description like @filter")
                    .Append(DatabaseHelper.GetPagingSql(_settings, offset, limit));

                return await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sqlBuilder.ToString(),
                    async (cmd) =>
                {
                    if (!string.IsNullOrEmpty(filter))
                        DatabaseHelper.AddParameter(cmd, "@filter", filter, _settings.DefaultDatabaseType);
                    if (offset > 0)
                        DatabaseHelper.AddParameter(cmd, "@offset", offset, _settings.DefaultDatabaseType);
                    DatabaseHelper.AddParameter(cmd, "@limit", limit, _settings.DefaultDatabaseType);

                    return await DatabaseHelper.IterateAsync(cmd, (reader) =>
                    {
                        var dt = reader.GetDateTime(3);
                        if (_settings.DefaultDatabaseType == "mysql")
                            dt = DateTime.SpecifyKind(dt, DateTimeKind.Local); // MySQL always returns items in local server time.
                        else if (_settings.DefaultDatabaseType == "sqlite")
                            dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc); // SQLite always stores date objects as UTC

                        return new MagicTask(
                            reader[0] as string,
                            reader[1] as string,
                            reader[2] as string)
                        {
                            Created = dt,
                        };
                    });
                });
            });
        }

        /// <inheritdoc />
        public Task<MagicTask> GetTaskAsync(string id, bool schedules = false)
        {
            return GetTaskAsync(
                _signaler,
                _settings,
                id,
                schedules,
                _settings.DefaultDatabaseType);
        }

        /// <inheritdoc />
        public async Task<int> CountTasksAsync(string filter)
        {
            return await DatabaseHelper.ConnectAsync(
                _signaler,
                _settings,
                async (connection) =>
            {
                var sqlBuilder = new StringBuilder();
                sqlBuilder
                    .Append("select count(*) from tasks")
                    .Append(string.IsNullOrEmpty(filter) ? "" : " where id like @filter or description like @filter");

                return await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sqlBuilder.ToString(),
                    async (cmd) =>
                {
                    if (!string.IsNullOrEmpty(filter))
                        DatabaseHelper.AddParameter(cmd, "@filter", filter, _settings.DefaultDatabaseType);

                    return Convert.ToInt32(await cmd.ExecuteScalarAsync());
                });
            });
        }

        /// <inheritdoc />
        public async Task UpdateTaskAsync(MagicTask task)
        {
            // Sanity checking invocation.
            if (task.Schedules.Any())
                throw new HyperlambdaException("You cannot update schedules for tasks when updating your task");

            await DatabaseHelper.ConnectAsync(
                _signaler,
                _settings,
                async (connection) =>
            {
                var sql = "update tasks set description = @description, hyperlambda = @hyperlambda where id = @id";

                await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sql,
                    async (cmd) =>
                {
                    DatabaseHelper.AddParameter(cmd, "@hyperlambda", task.Hyperlambda, _settings.DefaultDatabaseType);
                    DatabaseHelper.AddParameter(cmd, "@description", task.Description, _settings.DefaultDatabaseType);
                    DatabaseHelper.AddParameter(cmd, "@id", task.ID, _settings.DefaultDatabaseType);

                    if (await cmd.ExecuteNonQueryAsync() != 1)
                        throw new HyperlambdaException($"Task with ID of '{task.ID}' was not found");
                });
            });
        }

        /// <inheritdoc />
        public async Task DeleteTaskAsync(string id)
        {
            await DatabaseHelper.ConnectAsync(
                _signaler,
                _settings,
                async (connection) =>
            {
                var sql = "delete from tasks where id = @id";

                await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sql,
                    async (cmd) =>
                {
                    DatabaseHelper.AddParameter(cmd, "@id", id, _settings.DefaultDatabaseType);

                    // Making sure we delete all related timers.
                    lock (_dictionarySemaphore)
                    {
                        foreach (var idx in _schedules.Where(x => x.Value.TaskId == id).ToList())
                        {
                            _schedules.Remove(idx.Key);
                            idx.Value.Dispose();
                        }
                    }

                    /*
                     * To avoid funny race conditions we don't execute the delete SQL
                     * before AFTER having destroyed the timers associated with the task.
                     */
                    if (await cmd.ExecuteNonQueryAsync() != 1)
                        throw new HyperlambdaException($"Task with ID of '{id}' was not found");
                });
            });
        }

        /// <inheritdoc />
        public Task ExecuteTaskAsync(string id)
        {
            return ExecuteTaskAsync(
                _signaler,
                _settings,
                id);
        }

        #endregion

        #region [ -- Interface implementation for ITaskScheduler -- ]

        /// <inheritdoc />
        public async Task<int> ScheduleTaskAsync(string taskId, IRepetitionPattern repetition)
        {
            return await DatabaseHelper.ConnectAsync(
                _signaler,
                _settings,
                async (connection) =>
            {
                return await ScheduleTaskAsync(
                    connection,
                    taskId,
                    repetition);
            });
        }

        /// <inheritdoc />
        public async Task<int> ScheduleTaskAsync(string taskId, DateTime due)
        {
            return await DatabaseHelper.ConnectAsync(
                _signaler,
                _settings,
                async (connection) =>
            {
                return await ScheduleTaskAsync(
                    connection,
                    taskId,
                    due);
            });
        }

        /// <inheritdoc />
        public Task DeleteScheduleAsync(int id)
        {
            return DeleteScheduleAsync(
                _signaler,
                _settings,
                id);
        }

        /// <inheritdoc />
        public async Task StartAsync()
        {
            // Retrieving all schedules.
            var schedules = await DatabaseHelper.ConnectAsync(
                _signaler,
                _settings,
                async (connection) =>
            {
                var sql = "select id, task, due, repeats from task_due";

                return await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sql,
                    async (cmd) =>
                {
                    return await DatabaseHelper.IterateAsync<(int Id, string Task, DateTime Due, string Pattern)>(
                        cmd,
                        (reader) =>
                    {
                        var dt = reader.GetDateTime(2);
                        if (_settings.DefaultDatabaseType == "mysql")
                            dt = dt.ToUniversalTime(); // MySQL always returns items in local server time.

                        return (
                            reader.GetInt32(0),
                            reader[1] as string,
                            dt,
                            reader[3] as string);
                    });
                });
            });

            // Creating timers for all schedules.
            foreach (var idx in schedules)
            {
                CreateTimer(
                    _signalCreator,
                    _settingsFactory,
                    _loggerCreator,
                    idx.Id,
                    idx.Task,
                    idx.Due,
                    idx.Pattern == null ? null : PatternFactory.Create(idx.Pattern));
            }
        }

        #endregion

        #region [ -- Private helper methods -- ]

        /*
         * Static helper method to retrieve task from database.
         */
        static async Task<MagicTask> GetTaskAsync(
            ISignaler signaler,
            IDataSettings settings,
            string id,
            bool schedules,
            string dbType)
        {
            return await DatabaseHelper.ConnectAsync(
                signaler,
                settings,
                async (connection) =>
            {
                var sqlBuilder = new StringBuilder();
                sqlBuilder
                    .Append("select id, description, hyperlambda, created from tasks where id = @id")
                    .Append(DatabaseHelper.GetPagingSql(settings, 0L, 1L));

                return await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sqlBuilder.ToString(),
                    async (cmd) =>
                {
                    DatabaseHelper.AddParameter(cmd, "@id", id, dbType);
                    DatabaseHelper.AddParameter(cmd, "@limit", 1L, dbType);

                    var result = (await DatabaseHelper.IterateAsync(cmd, (reader) =>
                    {
                        var dt = reader.GetDateTime(3);
                        if (dbType == "mysql")
                            dt = DateTime.SpecifyKind(dt, DateTimeKind.Local); // MySQL always returns items in local server time.
                        else if (dbType == "sqlite")
                            dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc); // MySQL always returns items in local server time.

                        return new MagicTask(
                            reader[0] as string,
                            reader[1] as string,
                            reader[2] as string)
                        {
                            Created = dt,
                        };
                    })).FirstOrDefault() ?? throw new HyperlambdaException($"Task with ID of '{id}' was not found.");

                    if (schedules)
                    {
                        foreach (var idx in await GetSchedulesAsync(connection, result.ID, dbType))
                        {
                            result.Schedules.Add(idx);
                        }
                    }
                    return result;
                });
            });
        }

        /*
         * Static helper method to execute task.
         */
        static async Task ExecuteTaskAsync(
            ISignaler signaler,
            IDataSettings settings,
            string id)
        {
            // Retrieving task.
            var task = await GetTaskAsync(signaler, settings, id, false, settings.DefaultDatabaseType);
            if (task == null)
                throw new HyperlambdaException($"Task with ID of '{id}' was not found");

            // Transforming task's Hyperlambda to a lambda object.
            var hlNode = new Node("", task.Hyperlambda);
            await signaler.SignalAsync("hyper2lambda", hlNode);

            // Executing task.
            await signaler.SignalAsync("eval", hlNode);
        }

        /*
         * Returns schedules for task.
         */
        static async Task<IList<Schedule>> GetSchedulesAsync(DbConnection connection, string id, string dbType)
        {
            var sql = "select id, due, repeats from task_due where task = @task";

            return await DatabaseHelper.CreateCommandAsync(
                connection,
                sql,
                async (cmd) =>
            {
                DatabaseHelper.AddParameter(cmd, "@task", id, dbType);

                return await DatabaseHelper.IterateAsync(cmd, (reader) =>
                {
                    var dt = reader.GetDateTime(1);
                    if (dbType == "mysql")
                        dt = DateTime.SpecifyKind(dt, DateTimeKind.Local); // MySQL always returns items in local server time.
                    else if (dbType == "sqlite")
                        dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc); // SQLite always stores dates as UTC.

                    return new Schedule(dt, reader[2] as string)
                    {
                        Id = reader.GetInt32(0),
                    };
                });
            });
        }

        /*
         * Static helper method to delete a schedule.
         */
        static async Task DeleteScheduleAsync(
            ISignaler signaler,
            IDataSettings settings,
            int id)
        {
            await DatabaseHelper.ConnectAsync(
                signaler,
                settings,
                async (connection) =>
            {
                var sql = "delete from task_due where id = @id";

                await DatabaseHelper.CreateCommandAsync(
                    connection,
                    sql,
                    async (cmd) =>
                {
                    DatabaseHelper.AddParameter(cmd, "@id", id, settings.DefaultDatabaseType);

                    lock (_dictionarySemaphore)
                    {
                        if (_schedules.ContainsKey(id))
                        {
                            var schedule = _schedules[id];
                            _schedules.Remove(id);
                            schedule.Dispose();
                        }
                    }

                    /*
                     * To avoid funny race conditions we wait until we have deleted all timers before
                     * we delete schedules from database.
                     */
                    await cmd.ExecuteNonQueryAsync();
                });
            });
        }

        /*
         * Helper method to schedule task with the specified connection.
         */
        async Task<int> ScheduleTaskAsync(
            DbConnection connection,
            string taskId,
            IRepetitionPattern repetition)
        {
            var sqlBuilder = new StringBuilder();
            sqlBuilder.Append("insert into task_due (task, due, repeats) values (@task, @due, @repeats)");
            sqlBuilder.Append(DatabaseHelper.GetInsertTail(_settings));

            return await DatabaseHelper.CreateCommandAsync(
                connection,
                sqlBuilder.ToString(),
                async (cmd) =>
            {
                var due = repetition.Next();
                DatabaseHelper.AddParameter(cmd, "@task", taskId, _settings.DefaultDatabaseType);
                DatabaseHelper.AddParameter(cmd, "@due", due, _settings.DefaultDatabaseType);
                DatabaseHelper.AddParameter(cmd, "@repeats", repetition.Value, _settings.DefaultDatabaseType);

                var scheduledId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                CreateTimer(
                    _signalCreator,
                    _settingsFactory,
                    _loggerCreator,
                    scheduledId,
                    taskId,
                    due,
                    repetition);
                return scheduledId;
            });
        }

        /*
         * Helper methods to schedule task on the specified connection.
         */
        async Task<int> ScheduleTaskAsync(
            DbConnection connection,
            string taskId,
            DateTime due)
        {
            var sqlBuilder = new StringBuilder();
            sqlBuilder.Append("insert into task_due (task, due) values (@task, @due)");
            sqlBuilder.Append(DatabaseHelper.GetInsertTail(_settings));

            return await DatabaseHelper.CreateCommandAsync(
                connection,
                sqlBuilder.ToString(),
                async (cmd) =>
            {
                DatabaseHelper.AddParameter(cmd, "@task", taskId, _settings.DefaultDatabaseType);
                DatabaseHelper.AddParameter(cmd, "@due", due, _settings.DefaultDatabaseType);

                var scheduleId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                CreateTimer(
                    _signalCreator,
                    _settingsFactory,
                    _loggerCreator,
                    scheduleId,
                    taskId,
                    due);
                return scheduleId;
            });
        }

        /*
         * Creates a timer that ensures task is executed at its next due date.
         */
        static void CreateTimer(
            IServiceCreator<ISignaler> signalFactory,
            IServiceCreator<IDataSettings> settingsFactory,
            IServiceCreator<ILogger> logFactory,
            int scheduleId,
            string taskId,
            DateTime due,
            IRepetitionPattern repetition = null)
        {
            /*
             * Notice, since the maximum future date for Timer is 45 days into the future, we
             * might have to do some "trickery" here to make sure we tick in the timer 45 days from
             * now, and postpone the execution if the schedule is for more than 45 days into the future.
             *
             * Notice, we also never execute a task before at least 250 milliseconds from now.
             */
            var whenMs = (due - DateTime.UtcNow).TotalMilliseconds;
            var maxMs = new TimeSpan(45, 0, 0, 0).TotalMilliseconds;
            var nextDue = (long)Math.Max(250L, Math.Min(whenMs, maxMs));
            var postpone = whenMs > maxMs;

            /*
             * Creating our schedule and keeping a reference to it such that we can stop
             * the schedule if asked to do so.
             */
            lock (_dictionarySemaphore)
            {
                // Creating our Timer instance.
                var timer = new Timer(async (state) =>
                {
                    /*
                     * Making sure we dispose existing timer.
                     *
                     * Notice, this little trickery of awaiting our semaphore from inside another
                     * wait on the same semaphore ensures that our timer always exists in our
                     * dictionary as we try to dispose it on the timer's thread. And yes, it looks weird,
                     * but remember that the timer's callback is executed on a different thread, so
                     * there are no deadlocks here, even though it technically might look like a deadlock.
                     */
                    lock (_dictionarySemaphore)
                    {
                        // Removing and disposing timer.
                        if (_schedules.ContainsKey(scheduleId))
                        {
                            var schedule = _schedules[scheduleId];
                            _schedules.Remove(scheduleId);
                            schedule.Dispose();
                        }
                    }

                    // Checking if we have to postpone execution of task further into the future.
                    if (postpone)
                    {
                        // More than 45 days until schedule is due, hence just re-creating our timer.
                        CreateTimer(
                            signalFactory,
                            settingsFactory,
                            logFactory,
                            scheduleId,
                            taskId,
                            due,
                            repetition);
                    }
                    else
                    {
                        // Executing task.
                        await ExecuteScheduleAsync(
                            signalFactory,
                            logFactory,
                            settingsFactory,
                            scheduleId,
                            taskId,
                            repetition);
                    }
                }, null, nextDue, Timeout.Infinite);

                // Stuffing wrapper into dictionary.
                _schedules[scheduleId] = new TaskScheduleWrapper(
                    timer,
                    taskId,
                    scheduleId,
                    repetition);
            }
        }

        /*
         * Helper method to execute task during scheduled time.
         */
        static async Task ExecuteScheduleAsync(
            IServiceCreator<ISignaler> signalFactory,
            IServiceCreator<ILogger> logCreator,
            IServiceCreator<IDataSettings> settingsFactory,
            int scheduleId,
            string taskId,
            IRepetitionPattern repetition)
        {
            // Creating our services.
            var signaler = signalFactory.Create();
            var settings = settingsFactory.Create();

            /*
             * Making sure we never allow for exception to propagate out of method,
             * while also making sure we never allow too many tasks to execute simultaneously.
             */
            await _executeSemaphore.WaitAsync();
            try
            {
                await ExecuteTaskAsync(signaler, settings, taskId);
            }
            catch (Exception error)
            {
                // Logging exception.
                var logger = logCreator.Create();
                var dictionary = new Dictionary<string, string>();
                dictionary["inner_exception"] = error.Message;
                await logger.ErrorAsync(
                  $"Unhandled exception while executing scheduled task with id of '{taskId}'",
                  dictionary,
                  error.StackTrace);
            }
            finally
            {
                // Releasing semaphore.
                _executeSemaphore.Release();
                
                // Making sure we update task_due value if task is repeating.
                if (repetition != null)
                {
                    await DatabaseHelper.ConnectAsync(
                        signaler,
                        settings,
                        async (connection) =>
                    {
                        var sql = "update task_due set due = @due where id = @id";

                        await DatabaseHelper.CreateCommandAsync(
                            connection,
                            sql,
                            async (cmd) =>
                        {
                            var nextDue = repetition.Next();
                            DatabaseHelper.AddParameter(cmd, "@due", nextDue, settings.DefaultDatabaseType);
                            DatabaseHelper.AddParameter(cmd, "@id", scheduleId, settings.DefaultDatabaseType);

                            int affectedRows = await cmd.ExecuteNonQueryAsync();

                            // Verifying we had more than 0 affected rows. 0 might be result if task was deleted from inside of task.
                            if (affectedRows > 0)
                            {
                                // Creating a new timer for task.
                                CreateTimer(
                                    signalFactory,
                                    settingsFactory,
                                    logCreator,
                                    scheduleId,
                                    taskId,
                                    nextDue,
                                    repetition);
                            }
                        });
                    });
                }
                else
                {
                    // Making sure we delete schedule from database.
                    await DeleteScheduleAsync(
                        signaler,
                        settings,
                        scheduleId);
                }
            }
        }

        #endregion
    }
}
