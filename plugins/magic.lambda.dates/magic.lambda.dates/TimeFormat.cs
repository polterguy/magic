/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Globalization;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.dates
{
    /// <summary>
    /// [time.format] slot, allowing you to format time.
    /// </summary>
    [Slot(
        Name = "time.format",
        Description = "Formats a TimeSpan value",
        ValueKind = "timespan",
        ValueDescription = "Time span to format",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "formatted-time,text",
        ReturnsDescription = "Resolves to the formatted time string",
        SignatureType = typeof(global::magic.lambda.dates.signatures.DateFormatSignature))]
    public class TimeFormat : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var format = input.Children.FirstOrDefault(x => x.Name == "format")?.GetEx<string>() ??
                throw new HyperlambdaException("No [format] provide to [time.format]");
            input.Value = input.GetEx<TimeSpan>().ToString(format, CultureInfo.InvariantCulture);
            input.Clear();
        }
    }
}
