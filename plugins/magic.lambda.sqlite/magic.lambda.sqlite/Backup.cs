/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.sqlite.helpers;
using System.Linq;
using magic.node.extensions;
using Aista.Data.Sqlite;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.backup] slot for creating a backup of database.
    /// </summary>
    [Slot(Name = "sqlite.backup")]
    public class Backup : ISlotAsync
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        /// <returns>An awaitable task.</returns>
        public Task SignalAsync(ISignaler signaler, Node input)
        {
            using (var shutdownLock = new ShutdownLock())
            {
                var source = signaler.Peek<SqliteConnectionWrapper>("sqlite.connect").Connection;
                using (var destination = new SqliteConnection(string.Format(@"Data Source=files/data/{0};", input.GetEx<string>())))
                {
                    source.BackupDatabase(destination);
                    return Task.CompletedTask;
                }
            }
        }
    }
}
