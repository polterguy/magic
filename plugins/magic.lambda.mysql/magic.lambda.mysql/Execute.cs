/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.mysql.helpers;

namespace magic.lambda.mysql
{
    /// <summary>
    /// [mysql.execute] slot for executing a non query SQL command.
    /// </summary>
    [Slot(
        Name = "mysql.execute",
        Description = "Executes SQL on the current MySQL connection",
        ValueKind = "sql-execute",
        ValueDescription = "SQL statement to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected by the SQL statement",
        RequiresScope = "mysql.connection",
        ScopeDescription = "Requires an open MySQL connection created by [mysql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbExecuteSignature))]
    public class Execute : ISlotAsync
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await Executor.ExecuteAsync(
                input,
                signaler.Peek<MySqlConnectionWrapper>("mysql.connect").Connection,
                signaler.Peek<Transaction>("mysql.transaction"),
                async (cmd, _) =>
            {
                MySqlConnectionWrapper.EnsureLocalTimeZone(cmd);
                input.Value = await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
            }, signaler.GetCancellationToken());
        }
    }
}
