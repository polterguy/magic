/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [return-nodes] slot for returning nodes from some evaluation object.
    /// </summary>
    [Slot(
        Name = "return-nodes",
        Description = "Returns child nodes or evaluated nodes to the nearest caller",
        ValueKind = "node-list",
        ValueDescription = "Expression evaluating to the nodes to return; omit to return the literal child nodes instead",
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsDescription = "Returns child nodes to the nearest caller",
        IsBlockTerminator = true,
        PipelineOutputUsable = false,
        WritesScopeResult = true,
        ValueOrChildrenRequired = true,
        SignatureType = typeof(global::magic.lambda.slots.signatures.ReturnNodesSignature))]
    [Slot(
        Name = "yield",
        Description = "Returns multiple child nodes or evaluated nodes to the caller",
        ValueMode = SlotValueMode.None,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsDescription = "Returns child nodes to the caller",
        WritesScopeResult = true,
        ValueOrChildrenRequired = true,
        SignatureType = typeof(global::magic.lambda.slots.signatures.YieldSignature))]
    public class ReturnNodes : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Checking if we should forward evaluate all descendant nodes.
            if (input.Name == "yield")
                Expression.Unwrap(GetDescendants(input), true);

            var result = signaler.Peek<Node>("slots.result");
            if (input.Value == null)
                result.MoveChildrenFrom(input);
            else
                result.AddRange(input.Evaluate().Select(x => x.Clone()));
        }

        #region [ -- Private helper methods -- ]

        static IEnumerable<Node> GetDescendants(Node input)
        {
            if (!input.Children.Any())
                yield break;
            foreach (var idx in input.Children)
            {
                yield return idx;
                foreach (var idxInner in GetDescendants(idx))
                {
                    yield return idxInner;
                }
            }
        }

        #endregion
    }
}
