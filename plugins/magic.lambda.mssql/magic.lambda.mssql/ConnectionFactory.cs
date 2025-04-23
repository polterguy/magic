/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Microsoft.Data.SqlClient;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.mssql
{
    /// <summary>
    /// [.db-factory.connection.mssql] slot for creating an SQL Server connection and returning to caller.
    /// </summary>
    [Slot(Name = ".db-factory.connection.mssql")]
    public class ConnectionFactory : ISlot
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = new SqlConnection();
        }
    }
}
