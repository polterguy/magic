/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using magic.node.contracts;
using Microsoft.Data.Sqlite;

namespace magic.lambda.sqlite.helpers
{
    /*
     * Internal helper class to create a MySqlConnection lazy, such that it is not actuall created
     * before it's actually de-referenced.
     */
    internal sealed class SqliteConnectionWrapper : IDisposable
    {
        readonly Lazy<SqliteConnection> _connection;

        public SqliteConnectionWrapper(IRootResolver resolver, string connectionString)
        {
            _connection = new Lazy<SqliteConnection>(() =>
            {
                var connection = new SqliteConnection(connectionString);
                connection.Open();
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
            {
                _connection.Value.Close();
                _connection.Value.Dispose();
            }
        }
    }
}
