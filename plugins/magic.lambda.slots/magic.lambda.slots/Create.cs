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
    [Slot(
        Name = "function",
        Description = "Creates a dynamic slot that can be invoked with [signal]",
        ValueKind = "dynamic-slot-name",
        ValueDescription = "Name of the dynamic slot to create",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        ClonesLambda = true,
        SignatureType = typeof(global::magic.lambda.slots.signatures.CreateSlotSignature))]
    [Slot(
        Name = "slots.create",
        Description = "Creates a dynamic slot that can be invoked with [signal]",
        ValueKind = "dynamic-slot-name",
        ValueDescription = "Name of the dynamic slot to create",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        ClonesLambda = true,
        SignatureType = typeof(global::magic.lambda.slots.signatures.CreateSlotSignature))]
    public class Create : ISlot
    {
        internal static readonly ConcurrentDictionary<string, Node> _slots = new ();

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
