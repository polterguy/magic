/*
 * Magic Cloud, copyright (c) 2026 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading
{
    /// <summary>
    /// [execution.kill] to kill a process by its ID
    /// </summary>
    [Slot(
        Name = "execution.kill",
        Description = "Cancels a running execution by execution ID",
        ValueKind = "execution-id",
        ValueDescription = "Execution ID to cancel",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true if the execution was cancelled")]
    public class ExecutionKill : ISlot
    {
        readonly IExecutionRegistry _executionRegistry;

        public ExecutionKill(IExecutionRegistry executionRegistry)
        {
            _executionRegistry = executionRegistry;
        }

        public void Signal(ISignaler signaler, Node input)
        {
            var id = input.GetEx<string>();
            input.Value = _executionRegistry.TryCancel(id);
        }
    }
}
