/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.sqlite.helpers;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.scalar] slot for executing a scalar type of SQL command.
    /// </summary>
    [Slot(Name = "sqlite.scalar")]
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
            using (var shutdownLock = new ShutdownLock())
            {
                await Executor.ExecuteAsync(
                    input,
                    signaler.Peek<SqliteConnectionWrapper>("sqlite.connect").Connection,
                    signaler.Peek<Transaction>("sqlite.transaction"),
                    async (cmd, _) =>
                {
                    input.Value = await cmd.ExecuteScalarAsync();
                });
            }
        }
    }
}
