/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using Microsoft.Data.Sqlite;
using magic.node;
using magic.lambda.sqlite;
using magic.signals.contracts;

namespace magic.library.internals
{
    /*
     * Internal helper class to help wire up plugins for SQLite.
     */
     [Slot(Name = "sqlite.upgrade")]
    internal class SQLiteInitializer : ISlot, IInitializer
    {
        private static bool _legacy = true;
        private static readonly SemaphoreSlim _lock = new(1, 1);

        public void Signal(ISignaler signaler, Node input)
        {
            _legacy = false;
        }

        public async Task Initialize(SqliteConnection connection)
        {
            await connection.OpenAsync();
            await EnsureVectorLoadedAsync(connection).ConfigureAwait(false);
        }

        /*
         * Ensures serialized initialization of vector lib.
         */
        private static async Task EnsureVectorLoadedAsync(SqliteConnection connection)
        {
            await _lock.WaitAsync().ConfigureAwait(false);
            try
            {
                if (_legacy)
                {
                    if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                    {
                        if (RuntimeInformation.ProcessArchitecture == Architecture.Arm64)
                        {
                            connection.LoadExtension("./sqlite-plugins/vector0-64");
                            connection.LoadExtension("./sqlite-plugins/vss0-64");
                        }
                        else
                        {
                            connection.LoadExtension("./sqlite-plugins/vector0");
                            connection.LoadExtension("./sqlite-plugins/vss0");
                        }
                    }
                }
                else
                {
                    connection.LoadExtension("./sqlite-plugins/vector");
                }
            }
            finally
            {
                _lock.Release();
            }
        }
    }
}