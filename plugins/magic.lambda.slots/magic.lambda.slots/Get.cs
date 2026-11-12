/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [slots.get] slot for retrieving slot that has been created with the [slots.create] slot.
    /// </summary>
    [Slot(
        Name = "slots.get",
        Description = "Returns a dynamic slot by name",
        ValueKind = "dynamic-slot-name",
        ValueDescription = "Name of the dynamic slot to retrieve",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "dynamic-slot-lambda,lambda-object,lambda-tree",
        ReturnsDescription = "Resolves to the dynamic slot lambda body as child nodes",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
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
