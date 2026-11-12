/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [type] slot allowing you to retrieve Hyperlambda type information for some specified value.
    /// </summary>
    [Slot(
        Name = "type",
        Description = "Returns the CLR type name of a value",
        ValueKind = "single-object",
        ValueDescription = "Expression selecting the value whose CLR type should be inspected",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "type-name,text",
        ReturnsDescription = "Resolves to the runtime type name of the first matching value",
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class Type : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var ex = input.Value as Expression ?? throw new HyperlambdaException("No expression given to [type]");
            var value = ex.Evaluate(input).Single().Value;
            var result = Converter.ToString(value);
            input.Value = result.Item1;
        }
    }
}
