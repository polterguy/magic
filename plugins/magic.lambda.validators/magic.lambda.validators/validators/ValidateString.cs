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
    [Slot(Name = "validators.string")]
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
                    throw new HyperlambdaException(
                        $"'{value}' is not a valid string between {min} and {max} in length for [{name}]",
                        true,
                        400,
                        name);
            });
        }
    }
}
