/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.mssql.helpers;

namespace magic.lambda.mysql
{
    /// <summary>
    /// [mssql.transaction.create] slot for creating a new MS SQL database transaction.
    /// </summary>
    [Slot(Name = "mssql.transaction.create")]
    public class CreateTransaction : ISlotAsync
    {
        /// <summary>
        /// [mssql.transaction.create] slot for creating a new MS SQL database transaction.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await signaler.ScopeAsync(
                "mssql.transaction",
                new Transaction(signaler, signaler.Peek<SqlConnectionWrapper>("mssql.connect").Connection),
                async () => await signaler.SignalAsync("eval", input));
        }
    }
}
