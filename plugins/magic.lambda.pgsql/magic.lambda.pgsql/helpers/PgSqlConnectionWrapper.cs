/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Npgsql;

namespace magic.lambda.pgsql.helpers
{
    /*
     * Internal helper class to create a MySqlConnection lazy, such that it is not actuall created
     * before it's actually de-referenced.
     */
    internal sealed class PgSqlConnectionWrapper : IDisposable
    {
        readonly Lazy<NpgsqlConnection> _connection;

        public PgSqlConnectionWrapper(string connectionString)
        {
            _connection = new Lazy<NpgsqlConnection>(() =>
            {
                var connection = new NpgsqlConnection(connectionString);
                connection.Open();
                return connection;
            });
        }

        /*
         * Property to retrieve underlying PostgreSQL connection.
         */
        public NpgsqlConnection Connection => _connection.Value;

        public void Dispose()
        {
            if (_connection.IsValueCreated)
                _connection.Value.Dispose();
        }
    }
}
