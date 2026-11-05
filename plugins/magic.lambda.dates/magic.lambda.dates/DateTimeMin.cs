/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.dates
{
    /// <summary>
    /// [date.min] slot, returning minimum value for DateTime type.
    /// </summary>
    [Slot(
        Name = "date.min",
        Description = "Returns the minimum DateTime value",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "date",
        ReturnsDescription = "Resolves to the minimum supported DateTime value")]
    public class DateTimeMin : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = DateTime.MinValue;
        }
    }
}
