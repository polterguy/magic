/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.sqlite.helpers;
using Help = magic.data.common.helpers;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.transaction.create] slot for creating a new MySQL database transaction.
    /// </summary>
    [Slot(
        Name = "sqlite.transaction.create",
        Description = "Creates a SQLite transaction",
        ReturnsMode = SlotReturnsMode.None,
        RequiresScope = "sqlite.connection",
        ScopeDescription = "Requires an open SQLite connection created by [sqlite.connect]",
        ProvidesScope = "sqlite.transaction",
        ScopeRequiresStrictExit = true)]
    public class CreateTransaction : ISlotAsync
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            using (var shutdownLock = new Help.ShutdownLock())
            {
                await signaler.ScopeAsync(
                    "sqlite.transaction",
                    new Help.Transaction(signaler, signaler.Peek<SqliteConnectionWrapper>("sqlite.connect").Connection),
                    async () => await signaler.SignalAsync("eval", input, skipWhitelist: true));
            }
        }
    }
}
