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
    /// [date.format] slot, allowing you to format dates.
    /// </summary>
    [Slot(
        Name = "date.format",
        Description = "Formats a DateTime using a .NET format string (e.g. yyyy-MM-dd HH:mm) for display or logging",
        ValueKind = "date",
        ValueDescription = "Date value to format",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "formatted-date,text",
        ReturnsDescription = "Resolves to the formatted date string",
        SignatureType = typeof(global::magic.lambda.dates.signatures.DateFormatSignature))]
    public class DateTimeFormat : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var format = input.Children.FirstOrDefault(x => x.Name == "format")?.GetEx<string>() ??
                throw new HyperlambdaException("No [format] provide to [date.format]");
            input.Value = input.GetEx<DateTime>().ToString(format, CultureInfo.InvariantCulture);
            input.Clear();
        }
    }
}
