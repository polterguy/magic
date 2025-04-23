/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Aista.Data.Sqlite;

namespace magic.lambda.sqlite.helpers
{
    /*
     * Internal helper class to create a MySqlConnection lazy, such that it is not actuall created
     * before it's actually de-referenced.
     */
    internal sealed class SqliteConnectionWrapper : IDisposable
    {
        readonly Lazy<SqliteConnection> _connection;

        public SqliteConnectionWrapper(string connectionString, IInitializer initializer = null)
        {
            _connection = new Lazy<SqliteConnection>(() =>
            {
                var connection = new SqliteConnection(connectionString);
                initializer?.Initialize(connection);
                return connection;
            });
        }

        /*
         * Property to retrieve underlying PostgreSQL connection.
         */
        public SqliteConnection Connection => _connection.Value;

        public void Dispose()
        {
            if (_connection.IsValueCreated)
                _connection.Value.Dispose();
        }
    }
}
