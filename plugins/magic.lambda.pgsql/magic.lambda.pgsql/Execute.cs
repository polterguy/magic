/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.pgsql.helpers;

namespace magic.lambda.pgsql
{
    /// <summary>
    /// [pgsql.execute] slot for executing a non query SQL command.
    /// </summary>
    [Slot(
        Name = "pgsql.execute",
        Description = "Executes SQL on the current PostgreSQL connection",
        ValueKind = "sql-execute",
        ValueDescription = "SQL statement to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected by the SQL statement",
        RequiresScope = "pgsql.connection",
        ScopeDescription = "Requires an open PostgreSQL connection created by [pgsql.connect]",
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
                signaler.Peek<PgSqlConnectionWrapper>("pgsql.connect").Connection,
                signaler.Peek<Transaction>("pgsql.transaction"),
                async (cmd, _) =>
            {
                input.Value = await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
            }, signaler.GetCancellationToken());
        }
    }
}
