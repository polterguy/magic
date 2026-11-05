/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.validators.helpers;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.integer] slot, for verifying that some integer number is between [min] and [max] values.
    /// </summary>
    [Slot(
        Name = "validators.integer",
        Description = "Validates that an integer value or resolved expression result is within the allowed range, throwing if validation fails",
        ValueKind = "integer,number",
        ValueDescription = "Integer value or expression selecting the node or nodes to validate",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.validators.signatures.MinMaxIntSignature))]
    public class ValidateInteger : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var min = input.Children.FirstOrDefault(x => x.Name == "min")?.GetEx<long>() ?? long.MinValue;
            var max = input.Children.FirstOrDefault(x => x.Name == "max")?.GetEx<long>() ?? long.MaxValue;
            Enumerator.Enumerate<long>(input, (value, name) =>
            {
                if (value < min || value > max)
                    throw new HyperlambdaException(
                        $"'{value}' is not a valid number between {min} and {max} for [{name}]",
                        true,
                        400,
                        name);
            });
        }
    }
}
