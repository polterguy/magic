/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
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
    /// The [sqlite.delete] slot class
    /// </summary>
    [Slot(Name = "sqlite.delete")]
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

            using (var shutdownLock = new Help.ShutdownLock())
            {
                // Executing SQL, now parametrized.
                await Help.Executor.ExecuteAsync(
                    exe,
                    signaler.Peek<SqliteConnectionWrapper>("sqlite.connect").Connection,
                    signaler.Peek<Help.Transaction>("sqlite.transaction"),
                    async (cmd, _) =>
                {
                    input.Value = await cmd.ExecuteNonQueryAsync();
                    input.Clear();
                });
            }
        }
    }
}
