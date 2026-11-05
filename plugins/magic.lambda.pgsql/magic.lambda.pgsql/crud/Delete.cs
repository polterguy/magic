/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.pgsql.helpers;
using magic.lambda.pgsql.crud.builders;
using Help = magic.data.common.helpers;
using Build = magic.data.common.builders;

namespace magic.lambda.pgsql.crud
{
    /// <summary>
    /// The [pgsql.delete] slot class
    /// </summary>
    [Slot(
        Name = "pgsql.delete",
        Description = "Deletes rows through the current PostgreSQL connection; include a [where] child unless intentionally deleting every row in the table",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected",
        RequiresScope = "pgsql.connection",
        ScopeDescription = "Requires an open PostgreSQL connection created by [pgsql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbDeleteSignature))]
    public class Delete : ISlotAsync
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
            var exe = Build.SqlBuilder.Parse(new SqlDeleteBuilder(input));
            if (exe == null)
                return;

            // Executing SQL, now parametrized.
            await Help.Executor.ExecuteAsync(
                exe,
                signaler.Peek<PgSqlConnectionWrapper>("pgsql.connect").Connection,
                signaler.Peek<Help.Transaction>("pgsql.transaction"),
                async (cmd, _) =>
            {
                input.Value = await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
                input.Clear();
            }, signaler.GetCancellationToken());
        }
    }
}
