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
    /// [exists] slot returning true if whatever expression it's given actually yields a result.
    /// </summary>
    [Slot(
        Name = "exists",
        Description = "Returns true if the specified node or expression exists",
        ValueKind = "node-list,single-object",
        ValueDescription = "Expression selecting the nodes to test for",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true if the expression resolves to one or more nodes",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    [Slot(
        Name = "not-exists",
        Description = "Returns true if the specified node or expression does not exist",
        ValueKind = "node-list,single-object",
        ValueDescription = "Expression selecting the nodes to test for",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true if the expression resolves to no nodes",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class Exists : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var hasAny = input.Evaluate().Any();
            input.Value = input.Name == "exists" ? hasAny : !hasAny;
        }
    }
}
