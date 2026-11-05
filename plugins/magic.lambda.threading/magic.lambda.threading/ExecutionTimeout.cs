/*
 * Magic Cloud, copyright (c) 2026 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading
{
    [Slot(
        Name = "execution.timeout",
        Description = "Sets a timeout in milliseconds for the current execution",
        ValueKind = "timeout-ms,integer,number",
        ValueDescription = "Timeout in milliseconds for the current execution",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true if the timeout was applied")]
    public class ExecutionTimeout : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            var milliseconds = input.GetEx<int>();
            if (milliseconds <= 0)
                throw new ArgumentOutOfRangeException(nameof(input), "Timeout must be greater than zero milliseconds");

            var execution = signaler.GetExecutionContext();
            if (execution == null)
                throw new InvalidOperationException("No current execution context exists");

            input.Value = execution.TrySetTimeout(TimeSpan.FromMilliseconds(milliseconds));
        }
    }
}
