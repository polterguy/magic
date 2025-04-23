/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Data;
using System.Data.Common;
using MySqlConnector;

namespace magic.lambda.mysql.helpers
{
    /*
     * Internal helper class to create a MySqlConnection lazy, such that it is not actuall created
     * before it's actually de-referenced.
     */
    internal sealed class MySqlConnectionWrapper : IDisposable
    {
        readonly Lazy<MySqlConnection> _connection;

        public MySqlConnectionWrapper(string connectionString)
        {
            _connection = new Lazy<MySqlConnection>(() =>
            {
                var connection = new MySqlConnection(connectionString);
                connection.Open();

                // Making sure we use the same time zone on our database session as our local server time zone.
                var offset = TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow).ToString(@"hh\:mm");
                using (var cmd = new MySqlCommand($"set time_zone = '+{offset}'"))
                {
                    cmd.Connection = connection;
                    cmd.ExecuteNonQuery();
                }
                return connection;
            });
        }

        /*
         * Property to retrieve underlying MySQL connection.
         */
        public MySqlConnection Connection => _connection.Value;

        /*
         * Converts all DateTime parameter values to local time zone.
         *
         * Notice, as we open our connection we explicitly set the session time zone
         * to the same time zone as the server to avoid "funny time zone slidings" due to
         * that MySQL doesn't support time zone information.
         *
         * This implies that all parameters passed into MySQL also needs to be converted
         * to local server's time zone before command is executed. The latter is being done
         * here.
         */
        public static void EnsureLocalTimeZone(DbCommand cmd)
        {
            foreach (MySqlParameter idx in cmd.Parameters)
            {
                if (idx.DbType == DbType.DateTime)
                {
                    idx.Value = ((DateTime)idx.Value).ToLocalTime();
                }
            }
        }

        public void Dispose()
        {
            if (_connection.IsValueCreated)
                _connection.Value.Dispose();
        }
    }
}
