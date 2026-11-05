/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.sqlite.helpers;
using magic.lambda.sqlite.crud.builders;
using Help = magic.data.common.helpers;
using Build = magic.data.common.builders;

namespace magic.lambda.sqlite.crud
{
    /// <summary>
    /// The [sqlite.create] slot class
    /// </summary>
    [Slot(
        Name = "sqlite.create",
        Description = "Inserts rows through the current SQLite connection",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "",
        ReturnsDescription = "Resolves to the created row ID when [return-id] is true, otherwise null",
        RequiresScope = "sqlite.connection",
        ScopeDescription = "Requires an open SQLite connection created by [sqlite.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbCreateSignature))]
    public class Create : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            /*
             * Checking if caller wants us to return the ID of the newly
             * create record.
             */
            var returnId = input.Children
                .FirstOrDefault(x => x.Name == "return-id")?.GetEx<bool>() ?? true;

            // Parsing and creating SQL.
            var exe = returnId ?
                Build.SqlBuilder.Parse(new SqlCreateBuilder(input)) :
                Build.SqlBuilder.Parse(new SqlCreateBuilderNoId(input));

            /*
             * Notice, if the builder doesn't return a node, we are
             * not supposed to actually execute the SQL, but rather only
             * to generate it.
             */
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
                    /*
                    * Checking if caller wants us to return the ID of the newly
                    * created record.
                    */
                    if (returnId)
                    {
                        input.Value = await cmd.ExecuteScalarAsync(signaler.GetCancellationToken());
                    }
                    else
                    {
                        await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
                        input.Value = null;
                    }
                    input.Clear();
                }, signaler.GetCancellationToken());
            }
        }
    }
}
