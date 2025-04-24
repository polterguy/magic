/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Runtime.InteropServices;
using Aista.Data.Sqlite;
using magic.lambda.sqlite;

namespace magic.library.internals
{
    /*
     * Internal helper class to help wire up plugins for SQLite.
     */
    internal class SQLiteInitializer : IInitializer
    {
        public void Initialize(SqliteConnection connection)
        {
            connection.EnableExtensions();
            connection.Open();

            // We don't have sqlite-vss on Windows :/
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                if (RuntimeInformation.ProcessArchitecture == Architecture.Arm64)
                {
                    using (var cmd = connection.CreateCommand())
                    {
                        var cmdTxt = @"select load_extension(""./sqlite-plugins/vector0-64"", ""sqlite3_vector_init"");select load_extension(""./sqlite-plugins/vss0-64"", ""sqlite3_vss_init"");";
                        cmd.CommandText = cmdTxt;
                        cmd.ExecuteNonQuery();
                    }
                }
                else
                {
                    using (var cmd = connection.CreateCommand())
                    {
                        var cmdTxt = @"select load_extension(""./sqlite-plugins/vector0"", ""sqlite3_vector_init"");select load_extension(""./sqlite-plugins/vss0"", ""sqlite3_vss_init"");";
                        cmd.CommandText = cmdTxt;
                        cmd.ExecuteNonQuery();
                    }
                }
            }
        }
    }
}