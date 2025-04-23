/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Aista.Data.Sqlite;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [.db-factory.connection.sqlite] slot for creating an SQLite connection and returning to caller.
    /// </summary>
    [Slot(Name = ".db-factory.connection.sqlite")]
    public class ConnectionFactory : ISlot
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = new SqliteConnection();
        }
    }
}
