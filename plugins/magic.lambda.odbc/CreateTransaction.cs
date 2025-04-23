/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.odbc.helpers;
using Help = magic.data.common.helpers;

namespace magic.lambda.odbc
{
    /// <summary>
    /// [odbc.transaction.create] slot for creating a new MySQL database transaction.
    /// </summary>
    [Slot(Name = "odbc.transaction.create")]
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
                "odbc.transaction",
                new Help.Transaction(signaler, signaler.Peek<OdbcConnectionWrapper>("odbc.connect").Connection),
                async () => await signaler.SignalAsync("eval", input));
        }
    }
}
