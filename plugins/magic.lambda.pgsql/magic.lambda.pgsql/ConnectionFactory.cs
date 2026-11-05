/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using Npgsql;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.pgsql
{
    /// <summary>
    /// [.db-factory.connection.pgsql] slot for creating a PostgreSQL connection and returning to caller.
    /// </summary>
    [Slot(Name = ".db-factory.connection.pgsql", Description = "Creates a PostgreSQL connection factory",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "database-connection",
        ReturnsDescription = "Resolves to a new PostgreSQL connection instance")]
    public class ConnectionFactory : ISlot
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = new NpgsqlConnection();
        }
    }
}
