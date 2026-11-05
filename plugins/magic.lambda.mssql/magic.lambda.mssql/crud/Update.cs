/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.mssql.helpers;
using magic.lambda.mssql.crud.builders;
using Help = magic.data.common.helpers;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud
{
    /// <summary>
    /// [mssql.update] slot for updating a record in some table.
    /// </summary>
    [Slot(
        Name = "mssql.update",
        Description = "Updates rows through the current SQL Server connection; use [where] to constrain affected rows",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected",
        RequiresScope = "mssql.connection",
        ScopeDescription = "Requires an open SQL Server connection created by [mssql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbUpdateSignature))]
    public class Update : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Parsing and creating SQL.
            var exe = Build.SqlBuilder.Parse(new SqlUpdateBuilder(input));
            if (exe == null)
                return;

            // Executing SQL, now parametrized.
            await Help.Executor.ExecuteAsync(
                exe,
                signaler.Peek<SqlConnectionWrapper>("mssql.connect").Connection,
                signaler.Peek<Help.Transaction>("mssql.transaction"),
                async (cmd, _) =>
            {
                input.Value = await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
                input.Clear();
            }, signaler.GetCancellationToken());
        }
    }
}
