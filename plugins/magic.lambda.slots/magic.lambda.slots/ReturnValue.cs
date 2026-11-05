/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [return-value] slot for returning a piece of value from some evaluation object.
    /// </summary>
    [Slot(
        Name = "return-value",
        Description = "Returns a value to the caller",
        ValueKind = "return-value",
        ValueDescription = "Value to return to the nearest caller",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "return-value",
        ReturnsDescription = "Resolves to a value to the caller",
        IsBlockTerminator = true,
        PipelineOutputUsable = false,
        WritesScopeResult = true)]
    public class ReturnValue : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler.Peek<Node>("slots.result").Value = input.GetEx<object>();
        }
    }
}
