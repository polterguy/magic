/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text.RegularExpressions;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.validators.helpers;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.regex] slot, for verifying that some input is matching some specified regular expression found in [regex].
    /// </summary>
    [Slot(Name = "validators.regex")]
    public class ValidateRegex : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var pattern = input.Children.First(x => x.Name == "regex").GetEx<string>();
            Enumerator.Enumerate<string>(input, (value, name) =>
            {
                var isMatch = new Regex(pattern).IsMatch(value);
                if (!isMatch)
                    throw new HyperlambdaException(
                        $"'{value}' does not conform to regular expression of '{pattern}' for [{name}]",
                        true,
                        400,
                        name);
            });
        }
    }
}
