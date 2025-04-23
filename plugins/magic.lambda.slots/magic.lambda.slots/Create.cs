/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Concurrent;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [slots.create] slot that creates a dynamic slot, that can be invoked using the [signal] slot.
    /// </summary>
    [Slot(Name = "function")]
    [Slot(Name = "slots.create")]
    public class Create : ISlot
    {
        internal static ConcurrentDictionary<string, Node> _slots = new ();

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var key = input.Get<string>();
            var clone = input.Clone();
            _slots.AddOrUpdate(key, clone, (_, _) => clone);
        }
    }
}
