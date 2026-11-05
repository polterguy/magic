/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using Microsoft.Data.Sqlite;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.connections.flush] slot for flushing SQLite connections.
    /// </summary>
    [Slot(
        Name = "sqlite.connections.flush",
        Description = "Flushes cached SQLite connections",
        ReturnsMode = SlotReturnsMode.None)]
    public class FlushConnections : ISlot
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            SqliteConnection.ClearAllPools();
        }
    }
}
