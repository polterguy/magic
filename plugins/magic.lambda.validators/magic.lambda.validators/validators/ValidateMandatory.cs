/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.mandatory] slot, for verifying that some input was given.
    /// </summary>
    [Slot(
        Name = "validators.mandatory",
        Description = "Validates that the input value or resolved expression result is present, throwing if validation fails",
        ValueKind = "validated-value",
        ValueDescription = "Literal value or expression to validate as mandatory",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class ValidateMandatory : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var value = input.GetEx<object>();
            var name = input.Value is Expression exp ? exp.Iterators.Last().Value : "";
            if (value == null)
            {
                var ex = input.Value as Expression;
                if (ex != null && (ex.Evaluate(input)?.FirstOrDefault()?.Children.Any() ?? false))
                    return;
                throw new HyperlambdaException(
                    $"Mandatory argument '{name}' not given",
                    true,
                    400,
                    name);
            }
        }
    }
}
