/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [slots.delete] slot for deleting slot that has been created with the [slots.create] slot.
    /// </summary>
    [Slot(Name = "slots.delete")]
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
