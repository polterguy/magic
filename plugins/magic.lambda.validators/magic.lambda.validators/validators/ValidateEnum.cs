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
    /// [validators.enum] slot, for verifying that some string value is one of the specified options.
    /// </summary>
    [Slot(Name = "validators.enum")]
    public class ValidateEnum : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            Enumerator.Enumerate<string>(input, (value, name) =>
            {
                if (!input.Children.Any(x2 => x2.Get<string>() == value))
                {
                    var legalValues = input.Children.Select(x2 => "'" + x2.Get<string>() + "'");
                    var legalValueString = string.Join(", ", legalValues.ToArray());
                    input.Clear();
                    throw new HyperlambdaException(
                        $"'{value}' is not a valid enum of [{legalValueString}] for [{name}]",
                        true,
                        400,
                        name);
                }
            });
        }
    }
}
