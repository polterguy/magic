/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.source
{
    /// <summary>
    /// [get-value] slot that will return the value of the node found by evaluating an expression.
    /// </summary>
    [Slot(
        Name = "get-value",
        Description = "Returns the value of the first matching node",
        ValueKind = "single-object",
        ValueDescription = "Expression selecting the node whose value should be retrieved",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "",
        ReturnsDescription = "Resolves to the value of the first matching node",
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class GetValue : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = input.GetEx<object>();
        }
    }
}
