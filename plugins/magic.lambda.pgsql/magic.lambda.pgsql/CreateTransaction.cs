/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.pgsql.helpers;
using Help = magic.data.common.helpers;

namespace magic.lambda.pgsql
{
    /// <summary>
    /// [pgsql.transaction.create] slot for creating a new MySQL database transaction.
    /// </summary>
    [Slot(Name = "pgsql.transaction.create")]
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
            await signaler.ScopeAsync(
                "pgsql.transaction",
                new Help.Transaction(signaler, signaler.Peek<PgSqlConnectionWrapper>("pgsql.connect").Connection),
                async () => await signaler.SignalAsync("eval", input));
        }
    }
}
