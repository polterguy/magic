/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.validators.helpers;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.string] slot, for verifying that some string is between [min] and [max] in length.
    /// </summary>
    [Slot(
        Name = "validators.string",
        Description = "Validates that a string value or resolved expression result is within the allowed length range, throwing if validation fails",
        ValueKind = "text",
        ValueDescription = "String value or expression selecting the node or nodes to validate",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.validators.signatures.MinMaxStringSignature))]
    public class ValidateString : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var min = input.Children.FirstOrDefault(x => x.Name == "min")?.GetEx<int>() ?? 0;
            var max = input.Children.FirstOrDefault(x => x.Name == "max")?.GetEx<int>() ?? int.MaxValue;
            Enumerator.Enumerate<string>(input, (value, name) =>
            {
                if (value.Length < min || value.Length > max)
                {
                    /*
                     * Never echoing the whole value - a caller can legally send megabytes, and the
                     * message is returned to the caller, logged, and captured by exception handlers.
                     */
                    var shown = value.Length > 50 ? value[..50] + "\u2026" : value;
                    throw new HyperlambdaException(
                        $"'{shown}' is not a valid string between {min} and {max} in length for [{name}]",
                        true,
                        400,
                        name);
                }
            });
        }
    }
}
