/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.dates
{
    /// <summary>
    /// [date.from-unix] slot, allowing you to retrieve server time in UTC timezone.
    /// </summary>
    [Slot(
        Name = "date.from-unix",
        Description = "Converts a Unix timestamp into a DateTime value",
        ValueKind = "unix-timestamp,integer,number",
        ValueDescription = "Unix timestamp to convert",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "date",
        ReturnsDescription = "Resolves to the date represented by the supplied Unix timestamp")]
    public class FromUnix : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var dt = DateTime.UnixEpoch;
            input.Value = dt.AddSeconds(input.GetEx<long>());
        }
    }
}
