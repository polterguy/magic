/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.IO;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.sqlite.helpers;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.backup] slot for backing up the current SQLite connection.
    /// </summary>
    [Slot(
        Name = "sqlite.backup",
        Description = "Creates a backup of the current SQLite connection",
        ValueKind = "file-path",
        ValueDescription = "Target SQLite database filename under files/data/",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        RequiresScope = "sqlite.connection",
        ScopeDescription = "Requires an open SQLite connection created by [sqlite.connect]",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
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
                var name = input.GetEx<string>();

                // The target is a filename inside files/data/, never a path, which also keeps it out of the connection string syntax.
                if (string.IsNullOrEmpty(name) || name != Path.GetFileName(name) || name == "." || name == "..")
                    throw new HyperlambdaException($"[{input.Name}] expects a filename inside 'files/data/', and '{name}' is not one");

                var connectionString = new SqliteConnectionStringBuilder { DataSource = "files/data/" + name }.ConnectionString;
                using (var destination = new SqliteConnection(connectionString))
                {
                    source.BackupDatabase(destination);
                    return Task.CompletedTask;
                }
            }
        }
    }
}
