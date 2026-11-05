/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using Sys = System.Threading;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading
{
    /// <summary>
    /// [semaphore] slot, allowing you to create a semaphore,
    /// only allowing one caller entry into some lambda object at the same time.
    /// </summary>
    [Slot(
        Name = "sleep",
        Description = "Delays execution for the specified number of milliseconds",
        ValueKind = "timeout-ms,integer,number",
        ValueDescription = "Delay in milliseconds",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None)]
    public class Sleep : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaiatble task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await Sys.Tasks.Task.Delay(input.GetEx<int>(), signaler.GetCancellationToken());
        }
    }
}
