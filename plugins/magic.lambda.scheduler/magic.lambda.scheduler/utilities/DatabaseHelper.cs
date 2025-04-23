/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Data.Common;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.data.common.contracts;
using magic.data.common.helpers;

namespace magic.lambda.scheduler.utilities
{
    internal static class DatabaseHelper
    {
        /*
         * Helper method to create a connection towards the default database, and execute
         * some arbitrary function from within your connection.
         */
        public static async Task ConnectAsync(
            ISignaler signaler,
            IDataSettings settings,
            Func<DbConnection, Task> functor)
        {
            using (var shutdownLock = new ShutdownLock())
            {
                using (var connection = await CreateConnectionAsync(signaler, settings))
                {
                    await functor(connection);
                }
            }
        }
        /*
         * Helper method to create a connection towards the default database, and execute
         * some arbitrary function from within your connection.
         */
        public static async Task<T> ConnectAsync<T>(
            ISignaler signaler,
            IDataSettings settings,
            Func<DbConnection, Task<T>> functor)
        {
            using (var shutdownLock = new ShutdownLock())
            {
                using (var connection = await CreateConnectionAsync(signaler, settings))
                {
                    return await functor(connection);
                }
            }
        }

        /*
         * Helper method to create a command towards the specified database connection,
         * and execute some arbitrary function with your command.
         */
        public static async Task CreateCommandAsync(
            DbConnection connection,
            string sql,
            Func<DbCommand, Task> functor)
        {
            using (var command = connection.CreateCommand())
            {
                command.CommandText = sql;
                await functor(command);
            }
        }

        /*
         * Helper method to create a command towards the specified database connection,
         * and execute some arbitrary function with your command.
         */
        public static async Task<T> CreateCommandAsync<T>(
            DbConnection connection,
            string sql,
            Func<DbCommand, Task<T>> functor)
        {
            using (var command = connection.CreateCommand())
            {
                command.CommandText = sql;
                return await functor(command);
            }
        }

        /*
         * Adds a parameter to the specified command.
         */
        public static void AddParameter(
            DbCommand command,
            string name,
            object value,
            string dbType)
        {
            var par = command.CreateParameter();
            par.ParameterName = name;
            if (dbType == "mysql" && value is DateTime dateVal && dateVal.Kind == DateTimeKind.Utc)
                value = dateVal.ToLocalTime();
            par.Value = value ?? DBNull.Value;
            command.Parameters.Add(par);
        }

        /*
         * Reads all records returned from specified command and returns to caller.
         */
        public static async Task<IList<T>> IterateAsync<T>(
            DbCommand command,
            Func<DbDataReader, T> functor)
        {
            using (var reader = await command.ExecuteReaderAsync())
            {
                var result = new List<T>();
                while (await reader.ReadAsync())
                {
                    result.Add(functor(reader));
                }
                return result;
            }
        }

        /*
         * Returns paging SQL parts to caller according to database type.
         */
        public static string GetPagingSql(
            IDataSettings settings,
            long offset,
            long limit)
        {
            switch (settings.DefaultDatabaseType)
            {
                case "mssql":
                    if (offset > 0)
                        return " order by id offset @offset rows fetch next @limit rows only";
                    return " order by id offset 0 rows fetch next @limit rows only";

                default:
                    if (offset > 0)
                        return " limit @limit offset @offset";
                    return " limit @limit";
            }
        }

        /*
         * Gets insert tail for SQL.
         */
        public static string GetInsertTail(IDataSettings settings)
        {
            switch (settings.DefaultDatabaseType)
            {
                case "mssql":
                    return "; select scope_identity();";

                case "mysql":
                    return "; select last_insert_id();";

                case "pgsql":
                    return " returning *";

                case "sqlite":
                    return "; select last_insert_rowid();";

                default:
                    throw new HyperlambdaException($"The scheduler doesn't support database type '{settings.DefaultDatabaseType}'");
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Creates and returns an IDbConnection using factory slot, and returns the result to caller.
         */
        static async Task<DbConnection> CreateConnectionAsync(
            ISignaler signaler,
            IDataSettings settings)
        {
            // Creating our database connection.
            var dbNode = new Node();
            signaler.Signal($".db-factory.connection.{settings.DefaultDatabaseType}", dbNode);
            var connection = dbNode.Get<DbConnection>();

            // Opening up database connection.
            connection.ConnectionString = settings.ConnectionString("generic").Replace("{database}", "magic");
            await connection.OpenAsync();

            // Returning open connection to caller.
            return connection;
        }

        #endregion
    }
}
