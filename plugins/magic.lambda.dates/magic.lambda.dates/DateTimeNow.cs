/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.dates
{
    /// <summary>
    /// [date.now] slot, allowing you to retrieve server time in UTC timezone.
    /// </summary>
    [Slot(
        Name = "date.now",
        Description = "Returns the current server time in UTC",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "date",
        ReturnsDescription = "Resolves to the current UTC date and time")]
    public class DateTimeNow : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = DateTime.UtcNow;
        }
    }
}
