/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Data.Common;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.data.common.contracts;
using magic.lambda.logging.contracts;

namespace magic.lambda.logging.services
{
    /// <inheritdoc/>
    public class Logger : ILogger, ILogQuery
    {
        const string ContentParameter = "@content";
        const string DebugLevel = "debug";
        const string ErrorLevel = "error";
        const string FatalLevel = "fatal";
        const string GenericConnection = "generic";
        const string MagicDatabase = "magic";
        const string MsSql = "mssql";
        const string MySql = "mysql";
        const string Sqlite = "sqlite";
        const string DatabasePlaceholder = "{database}";

        readonly ISignaler _signaler;
        readonly LogSettings _setting;
        readonly IDataSettings _dataSettings;

        /// <summary>
        /// Constructs a new instance of the default ILogger implementation.
        /// </summary>
        /// <param name="signaler">ISignaler implementation.</param>
        /// <param name="settings">Configuration object.</param>
        /// <param name="dataSettings">Database configuration object.</param>
        public Logger(ISignaler signaler, LogSettings settings, IDataSettings dataSettings)
        {
            _signaler = signaler;
            _setting = settings;
            _dataSettings = dataSettings;
        }

        #region [ -- Interface implementations -- ]

        #region [ -- ILogger interface implementation -- ]

        /// <inheritdoc/>
        public Task<object> DebugAsync(string content)
        {
            return InsertLogEntryAsync(_signaler, DebugLevel, content, null, null);
        }

        /// <inheritdoc/>
        public Task<object> DebugAsync(string content, Dictionary<string, string> meta)
        {
            return InsertLogEntryAsync(_signaler, DebugLevel, content, meta, null);
        }

        /// <inheritdoc/>
        public Task<object> InfoAsync(string content)
        {
            return InsertLogEntryAsync(_signaler, "info", content, null, null);
        }

        /// <inheritdoc/>
        public Task<object> InfoAsync(string content, Dictionary<string, string> meta)
        {
            return InsertLogEntryAsync(_signaler, "info", content, meta, null);
        }

        /// <inheritdoc/>
        public Task<object> ErrorAsync(string content)
        {
            return InsertLogEntryAsync(_signaler, ErrorLevel, content, null, null);
        }

        /// <inheritdoc/>
        public Task<object> ErrorAsync(string content, Dictionary<string, string> meta)
        {
            return InsertLogEntryAsync(_signaler, ErrorLevel, content, meta, null);
        }

        /// <inheritdoc/>
        public Task<object> ErrorAsync(string content, string stackTrace)
        {
            return InsertLogEntryAsync(_signaler, ErrorLevel, content, null, stackTrace);
        }

        /// <inheritdoc/>
        public Task<object> ErrorAsync(string content, Dictionary<string, string> meta, string stackTrace)
        {
            return InsertLogEntryAsync(_signaler, ErrorLevel, content, meta, stackTrace);
        }

        /// <inheritdoc/>
        public Task<object> FatalAsync(string content)
        {
            return InsertLogEntryAsync(_signaler, FatalLevel, content, null, null);
        }

        /// <inheritdoc/>
        public Task<object> FatalAsync(string content, Dictionary<string, string> meta)
        {
            return InsertLogEntryAsync(_signaler, FatalLevel, content, meta, null);
        }

        /// <inheritdoc/>
        public Task<object> FatalAsync(string content, string stackTrace)
        {
            return InsertLogEntryAsync(_signaler, FatalLevel, content, null, stackTrace);
        }

        /// <inheritdoc/>
        public Task<object> FatalAsync(string content, Dictionary<string, string> meta, string stackTrace)
        {
            return InsertLogEntryAsync(_signaler, FatalLevel, content, meta, stackTrace);
        }

        #endregion

        #region [ -- ILogQuery interface implementation -- ]

        /// <inheritdoc/>
        public Task<IEnumerable<LogItem>> QueryAsync(int max, object fromId, string content = null)
        {
            return WithCommandAsync<IEnumerable<LogItem>>(async command =>
            {
                var builder = new StringBuilder();
                var mid = _dataSettings.DefaultDatabaseType == MsSql ? $" top {max}" : "";
                builder.Append($"select{mid} id, created, type, content, exception, meta from log_entries");
                if (fromId != null)
                {
                    builder.Append(" where ");
                    builder.Append($"id < {Convert.ToInt64(fromId)}");
                }
                if (!string.IsNullOrEmpty(content))
                {
                    if (fromId == null)
                        builder.Append(" where ");
                    else
                        builder.Append(" and ");
                    builder.Append("content like @content");
                    var contentArg = command.CreateParameter();
                    contentArg.ParameterName = ContentParameter;
                    contentArg.Value = content;
                    command.Parameters.Add(contentArg);
                }
                builder.Append(" order by id desc");
                if (_dataSettings.DefaultDatabaseType != MsSql)
                    builder.Append($" limit {max}");
                command.CommandText = builder.ToString();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    var result = new List<LogItem>();
                    while (await reader.ReadAsync())
                    {
                        result.Add(ReadLogItem(reader));
                    }
                    return result;
                }
            });
        }

        /// <inheritdoc/>
        public Task<long> CountAsync(string content = null)
        {
            return WithCommandAsync(async command =>
            {
                var builder = new StringBuilder();
                builder.Append("select count(id) from log_entries");
                if (!string.IsNullOrEmpty(content))
                {
                    builder.Append(" where content like @content");
                    var contentArg = command.CreateParameter();
                    contentArg.ParameterName = ContentParameter;
                    contentArg.Value = content;
                    command.Parameters.Add(contentArg);
                }
                command.CommandText = builder.ToString();
                return Convert.ToInt64(await command.ExecuteScalarAsync());
            });
        }

        /// <inheritdoc/>
        public Task<IEnumerable<(string When, long Count)>> Timeshift(string content)
        {
            return WithCommandAsync<IEnumerable<(string When, long Count)>>(async command =>
            {
                var date = "";
                var tail = "";
                switch (_dataSettings.DefaultDatabaseType)
                {
                    case MySql:
                        date = "date_format(created, '%Y-%m-%d')";
                        tail = " limit 14";
                        break;

                    case MsSql:
                        date = "convert(char(10), created, 126)";
                        tail = " offset 0 rows fetch first 14 rows only";
                        break;

                    case "pgsql":
                        date = "to_char(created, 'YYYY-MM-dd')";
                        tail = " limit 14";
                        break;

                    case Sqlite:
                        date = "date(created)";
                        tail = " limit 14";
                        break;
                }
                var contentArg = command.CreateParameter();
                contentArg.ParameterName = ContentParameter;
                contentArg.Value = content;
                command.Parameters.Add(contentArg);
                command.CommandText = $"select {date} as date, count(*) as count from log_entries where " + 
                    (_dataSettings.DefaultDatabaseType == MsSql ? "convert(nvarchar(max), content)" : "content") +
                    $" = @content group by {date} order by {date} desc{tail}";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    var result = new List<(string When, long Count)>();
                    while (await reader.ReadAsync())
                    {
                        var when = reader["date"] as string;
                        var count = Convert.ToInt64(reader["count"]);
                        result.Add((when, count));
                    }
                    return result;
                }
            });
        }

        /// <inheritdoc/>
        public Task<LogItem> Get(object id)
        {
            return WithCommandAsync(async command =>
            {
                command.CommandText = "select id, created, type, content, exception, meta from log_entries where id = @id";
                var filter = command.CreateParameter();
                filter.ParameterName = "@id";
                filter.Value = id;
                command.Parameters.Add(filter);
                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                        return ReadLogItem(reader);
                    throw new HyperlambdaException($"Couldn't find log item with ID '{id}'");
                }
            });
        }

        /// <inheritdoc/>
        public Capabilities Capabilities()
        {
            return new Capabilities
            {
                CanFilter = true,
                CanTimeShift = true,
            };
        }

        #endregion

        #endregion

        #region [ -- Private helper methods and properties -- ]

        /*
         * Opens a connection to the log database, hands a command on it to the body, and closes everything again afterwards.
         */
        async Task<T> WithCommandAsync<T>(Func<DbCommand, Task<T>> body)
        {
            var dbNode = new Node();
            using (var shutdownLock = new ShutdownLock())
            {
                await _signaler.SignalAsync($".db-factory.connection.{_dataSettings.DefaultDatabaseType}", dbNode, skipWhitelist: true);
                using (var connection = dbNode.Get<DbConnection>())
                {
                    connection.ConnectionString = _dataSettings.ConnectionString(GenericConnection).Replace(DatabasePlaceholder, MagicDatabase);
                    await connection.OpenAsync();
                    using (var command = connection.CreateCommand())
                    {
                        return await body(command);
                    }
                }
            }
        }

        /*
         * Creates a log item from the row the reader currently is positioned at.
         */
        LogItem ReadLogItem(DbDataReader reader)
        {
            var dt = reader.GetDateTime(1);
            if (_dataSettings.DefaultDatabaseType == MySql)
                dt = dt.ToUniversalTime(); // MySQL always returns items in local server time.
            else if (_dataSettings.DefaultDatabaseType == Sqlite)
                dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc); // SQLite always stores dates as UTC

            var jString = reader["meta"] as string;
            var metaObj = jString == null ? null : ParseMeta(jString);
            return new LogItem
            {
                Id = Convert.ToString(reader["id"]),
                Created = dt,
                Type = reader["type"] as string,
                Content = reader["content"] as string,
                Exception = reader["exception"] as string,
                Meta = metaObj,
            };
        }

        /*
         * Parses the JSON object stored as meta information with a log entry into a dictionary of strings.
         */
        static Dictionary<string, string> ParseMeta(string json)
        {
            using (var document = JsonDocument.Parse(json))
            {
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                    throw new HyperlambdaException("Meta information of log entry is not a JSON object");
                var result = new Dictionary<string, string>();
                foreach (var idx in document.RootElement.EnumerateObject())
                {
                    result[idx.Name] = idx.Value.ValueKind switch
                    {
                        JsonValueKind.String => idx.Value.GetString(),
                        JsonValueKind.Null => null,
                        JsonValueKind.True => "True",
                        JsonValueKind.False => "False",
                        JsonValueKind.Number => idx.Value.GetRawText(),
                        _ => throw new HyperlambdaException($"Meta information '{idx.Name}' of log entry is not a simple value"),
                    };
                }
                return result;
            }
        }

        async Task<object> InsertLogEntryAsync(
            ISignaler signaler,
            string type,
            string content,
            Dictionary<string, string> meta,
            string stackTrace)
        {
            // Retrieving IDbConnection to use.
            var shouldLog = false;
            switch (type)
            {
                case DebugLevel:
                    shouldLog = _setting.Level == DebugLevel;
                    break;

                case "info":
                    shouldLog = _setting.Level == "info" || _setting.Level == DebugLevel;
                    break;

                case ErrorLevel:
                    shouldLog = _setting.Level == ErrorLevel || _setting.Level == "info" || _setting.Level == DebugLevel;
                    break;

                case FatalLevel:
                    shouldLog = _setting.Level == FatalLevel || _setting.Level == ErrorLevel || _setting.Level == "info" || _setting.Level == DebugLevel;
                    break;
            }

            // Verifying we're supposed to log.
            if (!shouldLog)
                return null;

            var dbNode = new Node();
            using (var shutdownLock = new ShutdownLock())
            {
                await _signaler.SignalAsync($".db-factory.connection.{_dataSettings.DefaultDatabaseType}", dbNode, skipWhitelist: true);
                using (var connection = dbNode.Get<DbConnection>())
                {
                    // Opening database connection.
                    connection.ConnectionString = _dataSettings.ConnectionString(GenericConnection).Replace(DatabasePlaceholder, MagicDatabase);
                    await connection.OpenAsync();

                    // Creating our insert commend.
                    using (var cmd = CreateCommand(signaler, connection, _dataSettings.DefaultDatabaseType, type, content, meta, stackTrace))
                    {
                        // The command selects the id of the entry it inserts.
                        return await cmd.ExecuteScalarAsync();
                    }
                }
            }
        }

        /*
         * Creates an IDbCommand that inserts into log database, and returns the command to caller.
         */
        static DbCommand CreateCommand(
            ISignaler signaler,
            DbConnection connection,
            string dbType,
            string type,
            string content,
            Dictionary<string, string> meta,
            string stackTrace)
        {
            // Creating our SQL command.
            var command = connection.CreateCommand();
            var builder = new StringBuilder();
            builder.Append("insert into log_entries (type, content");
            if (stackTrace != null)
                builder.Append(", exception");
            if (meta != null && meta.Count > 0)
                builder.Append(", meta");
            builder.Append(") values (@type, @content");
            if (stackTrace != null)
                builder.Append(", @exception");
            if (meta != null && meta.Count > 0)
                builder.Append(", @meta");
            builder.Append(')');

            // Returning the id of the inserted entry, allowing callers to reference it.
            switch (dbType)
            {
                case MySql:
                    builder.Append("; select last_insert_id()");
                    break;

                case MsSql:
                    builder.Append("; select scope_identity()");
                    break;

                case "pgsql":
                    builder.Append(" returning id");
                    break;

                case Sqlite:
                    builder.Append("; select last_insert_rowid()");
                    break;
            }
            command.CommandText = builder.ToString();

            // Adding arguments to invocation.
            var typeArg = command.CreateParameter();
            typeArg.ParameterName = "@type";
            typeArg.Value = type;
            command.Parameters.Add(typeArg);

            var contentArg = command.CreateParameter();
            contentArg.ParameterName = ContentParameter;
            contentArg.Value = content;
            command.Parameters.Add(contentArg);

            if (stackTrace != null)
            {
                var exceptionArg = command.CreateParameter();
                exceptionArg.ParameterName = "@exception";
                exceptionArg.Value = stackTrace;
                command.Parameters.Add(exceptionArg);
            }

            if (meta != null && meta.Count > 0)
            {
                var node = new Node();
                node.AddRange(meta.Select(x => new Node(x.Key, x.Value)));
                signaler.Signal("lambda2json", node, skipWhitelist: true);

                var metaArg = command.CreateParameter();
                metaArg.ParameterName = "@meta";
                metaArg.Value = node.Value;
                command.Parameters.Add(metaArg);
            }

            // Returning command to caller.
            return command;
        }

        #endregion
    }
}
