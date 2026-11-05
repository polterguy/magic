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
    /// [remove-nodes] slot allowing you to remove nodes from your lambda graph object.
    /// </summary>
    [Slot(
        Name = "remove-nodes",
        Description = "Removes nodes from the lambda graph",
        ValueKind = "node-list,single-object",
        ValueDescription = "Expression selecting the node or nodes to remove",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.None)]
    public class RemoveNodes : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            foreach (var idx in input.Evaluate().ToList())
            {
                idx.UnTie();
            }
        }
    }
}
