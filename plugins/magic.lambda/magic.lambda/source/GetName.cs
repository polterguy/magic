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
    /// [get-name] slot that will return the name of the node found by evaluating an expression.
    /// </summary>
    [Slot(
        Name = "get-name",
        Description = "Returns the name of the first matching node",
        ValueKind = "single-object",
        ValueDescription = "Expression selecting the node whose name should be retrieved",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "node-name,text",
        ReturnsDescription = "Resolves to the name of the first matching node",
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class GetName : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var src = input.Evaluate();
            if (src.Count() > 1)
                throw new HyperlambdaException("Too many nodes returned from [name] expression");
            input.Value = src.FirstOrDefault()?.Name;
        }
    }
}
