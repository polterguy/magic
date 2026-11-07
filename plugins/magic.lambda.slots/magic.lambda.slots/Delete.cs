/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [slots.delete] slot for deleting slot that has been created with the [slots.create] slot.
    /// </summary>
    [Slot(
        Name = "slots.delete",
        Whitelistable = false,
        Description = "Deletes a dynamic slot",
        ValueKind = "dynamic-slot-name",
        ValueDescription = "Name of the dynamic slot to delete",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None)]
    public class Delete : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            Create._slots.TryRemove(input.GetEx<string>(), out _);
            input.Clear();
            input.Value = null;
        }
    }
}
