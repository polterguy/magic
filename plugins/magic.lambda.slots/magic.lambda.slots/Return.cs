/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [return] slot for returning nodes or a single value from some evaluation object.
    /// </summary>
    [Slot(
        Name = "return",
        Description = "Returns a value, expression result, or child nodes to the nearest caller",
        ValueKind = "return-value,node-list",
        ValueDescription = "Value or expression to return when no child nodes are supplied; one expression match returns its value, multiple matches return cloned nodes",
        ValueRequired = false,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "return-value,node-list",
        ReturnsDescription = "Resolves to the supplied value and/or returned child nodes captured by the nearest caller",
        IsBlockTerminator = true,
        PipelineOutputUsable = false,
        WritesScopeResult = true,
        SignatureType = typeof(global::magic.lambda.slots.signatures.ReturnSignature))]
    public class Return : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var result = signaler.Peek<Node>("slots.result");
            if (input.Children.Any())
            {
                // Simple case
                result.MoveChildrenFrom(input);
                result.Value = input.Value;
            }
            else
            {
                // Checking if we have an expression value.
                if (input.Value is Expression exp)
                {
                    var expResult = exp.Evaluate(input).ToList();
                    if (expResult.Count == 1)
                        result.Value = expResult[0].Value;
                    else if (expResult.Count > 1)
                        result.AddRange(expResult.Select(x => x.Clone()));
                }
                else
                {
                    // Single return value.
                    result.Value = input.Value;
                }
            }
        }
    }
}
