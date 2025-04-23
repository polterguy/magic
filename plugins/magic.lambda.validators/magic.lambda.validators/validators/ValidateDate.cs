/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.validators.helpers;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.date] slot, for verifying that some date is between [min] and [max] values.
    /// </summary>
    [Slot(Name = "validators.date")]
    public class ValidateDate : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var min = input.Children.FirstOrDefault(x => x.Name == "min")?.GetEx<DateTime>() ?? DateTime.MinValue;
            var max = input.Children.FirstOrDefault(x => x.Name == "max")?.GetEx<DateTime>() ?? DateTime.MaxValue;
            Enumerator.Enumerate<DateTime>(input, (value, name) =>
            {
                if (value < min || value > max)
                    throw new HyperlambdaException(
                        $"'{value}' is not a valid date between '{min}' and '{max}' for [{name}]", 
                        true, 
                        400,
                        name);
            });
        }
    }
}
