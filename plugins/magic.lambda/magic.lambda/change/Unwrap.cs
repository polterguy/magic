/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.change
{
    /// <summary>
    /// [unwrap] slot allowing you to forward evaluate expressions in your lambda graph object.
    /// </summary>
    [Slot(
        Name = "unwrap",
        Description = "Forward-evaluates expression values on the selected nodes, replacing them with their resolved values; commonly used before [signal] or [add]",
        ValueKind = "node-list,single-object",
        ValueDescription = "Expression selecting the node or nodes whose expressions should be unwrapped",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.signatures.UnwrapSignature))]
    public class Unwrap : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var applyLists = input.Children.FirstOrDefault(x => x.Name == "apply-lists")?.GetEx<bool>() ?? false;
            Expression.Unwrap(input.Evaluate(), applyLists);
        }
    }
}
