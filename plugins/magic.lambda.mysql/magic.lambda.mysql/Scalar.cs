/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.lambda.mysql.crud;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.mysql.helpers;

namespace magic.lambda.mysql
{
    /// <summary>
    /// [mysql.scalar] slot for executing a scalar type of SQL command.
    /// </summary>
    [Slot(
        Name = "mysql.scalar",
        Description = "Executes SQL and returns a scalar value from the current MySQL connection",
        ValueKind = "sql-scalar",
        ValueDescription = "SQL statement to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "",
        ReturnsDescription = "Resolves to the scalar result of the SQL statement",
        RequiresScope = "mysql.connection",
        ScopeDescription = "Requires an open MySQL connection created by [mysql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbExecuteSignature))]
    public class Scalar : ISlotAsync
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
                input.Value = Read.GetValue(await cmd.ExecuteScalarAsync(signaler.GetCancellationToken()));
            }, signaler.GetCancellationToken());
        }
    }
}
