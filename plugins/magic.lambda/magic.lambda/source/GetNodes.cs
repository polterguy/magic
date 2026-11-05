/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.source
{
    /// <summary>
    /// [get-nodes] slot that will return all nodes from evaluating an expression.
    /// </summary>
    [Slot(
        Name = "get-nodes",
        Description = "Returns clones of every node matching the expression as children of the current node",
        ValueKind = "node-list",
        ValueDescription = "Expression selecting the nodes to retrieve",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsElementKind = "node",
        ReturnsDescription = "Resolves to the nodes matched by the expression as child nodes",
        PreservesInputShape = true)]
    public class GetNodes : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            if (input.Value == null)
                return;

            var src = input.Evaluate();
            foreach (var idx in src)
            {
                input.Add(idx.Clone());
            }
            input.Value = null;
        }
    }
}
