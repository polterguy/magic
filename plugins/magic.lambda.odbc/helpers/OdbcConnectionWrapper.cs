/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Data.Odbc;

namespace magic.lambda.odbc.helpers
{
    /*
     * Internal helper class to create a OdbcConnection lazy, such that it is not actuall created
     * before it's actually de-referenced.
     */
    internal sealed class OdbcConnectionWrapper : IDisposable
    {
        readonly Lazy<OdbcConnection> _connection;

        public OdbcConnectionWrapper(string connectionString)
        {
            _connection = new Lazy<OdbcConnection>(() =>
            {
                var connection = new OdbcConnection(connectionString);
                connection.Open();
                return connection;
            });
        }

        /*
         * Property to retrieve underlying MySQL connection.
         */
        public OdbcConnection Connection => _connection.Value;

        public void Dispose()
        {
            if (_connection.IsValueCreated)
                _connection.Value.Dispose();
        }
    }
}
