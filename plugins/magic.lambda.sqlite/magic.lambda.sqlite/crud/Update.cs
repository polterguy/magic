/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.sqlite.helpers;
using magic.lambda.sqlite.crud.builders;
using Help = magic.data.common.helpers;
using Build = magic.data.common.builders;

namespace magic.lambda.sqlite.crud
{
    /// <summary>
    /// The [sqlite.update] slot class
    /// </summary>
    [Slot(
        Name = "sqlite.update",
        Description = "Updates rows through the current SQLite connection; use [where] to constrain affected rows",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected",
        RequiresScope = "sqlite.connection",
        ScopeDescription = "Requires an open SQLite connection created by [sqlite.connect]",
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

            using (var shutdownLock = new Help.ShutdownLock())
            {
                // Executing SQL, now parametrized.
                await Help.Executor.ExecuteAsync(
                    exe,
                    signaler.Peek<SqliteConnectionWrapper>("sqlite.connect").Connection,
                    signaler.Peek<Help.Transaction>("sqlite.transaction"),
                    async (cmd, _) =>
                {
                    input.Value = await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
                    input.Clear();
                }, signaler.GetCancellationToken());
            }
        }
    }
}
