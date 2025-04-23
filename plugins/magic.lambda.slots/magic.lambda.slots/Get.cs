/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [slots.get] slot for retrieving slot that has been created with the [slots.create] slot.
    /// </summary>
    [Slot(Name = "slots.get")]
    public class Get : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            if (!Create._slots.TryGetValue(input.GetEx<string>(), out Node result))
                throw new HyperlambdaException("[slots.get] invoked for non-existing slot");
            input.Value = null;
            input.Clear();
            input.AddRange(result.Clone().Children);
        }
    }
}
