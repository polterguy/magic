/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.mssql.helpers;

namespace magic.lambda.mssql
{
    /// <summary>
    /// [mssql.execute] slot for executing a non query type of SQL.
    /// </summary>
    [Slot(
        Name = "mssql.execute",
        Description = "Executes SQL on the current SQL Server connection",
        ValueKind = "sql-execute",
        ValueDescription = "SQL statement to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected by the SQL statement",
        RequiresScope = "mssql.connection",
        ScopeDescription = "Requires an open SQL Server connection created by [mssql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbExecuteSignature))]
    public class Execute : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await Executor.ExecuteAsync(
                input,
                signaler.Peek<SqlConnectionWrapper>("mssql.connect").Connection,
                signaler.Peek<Transaction>("mssql.transaction"),
                async (cmd, _) =>
            {
                input.Value = await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
            }, signaler.GetCancellationToken());
        }
    }
}
