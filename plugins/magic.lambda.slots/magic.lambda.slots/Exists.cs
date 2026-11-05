/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [slots.exists] slot that will check if a dynamic slot exists or not.
    /// </summary>
    [Slot(
        Name = "slots.exists",
        Description = "Returns true if a dynamic slot exists",
        ValueKind = "dynamic-slot-name",
        ValueDescription = "Name of the dynamic slot to test for",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true if the slot exists")]
    public class Exists : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = Create._slots.ContainsKey(input.GetEx<string>());
        }
    }
}
