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
        private static bool legacy = true;
        private static readonly SemaphoreSlim _extGate = new(1, 1);

        public void Signal(ISignaler signaler, Node input)
        {
            legacy = false;
        }

        public void Initialize(SqliteConnection connection)
        {
            connection.Open();
            connection.EnableExtensions(true);
            
            if (legacy)
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
                EnsureVectorLoadedAsync(connection).ConfigureAwait(false);
            }
        }

        private static async Task EnsureVectorLoadedAsync(SqliteConnection connection)
        {
            await _extGate.WaitAsync().ConfigureAwait(false);
            try
            {
                connection.EnableExtensions(true);
                connection.LoadExtension("./sqlite-plugins/vector");
            }
            finally
            {
                _extGate.Release();
            }
        }
    }
}