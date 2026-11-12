/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.dates
{
    /// <summary>
    /// [date.max] slot, returning maximum value for DateTime type.
    /// </summary>
    [Slot(
        Name = "date.max",
        Description = "Returns the maximum DateTime value",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "date",
        ReturnsDescription = "Resolves to the maximum supported DateTime value",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class DateTimeMax : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = DateTime.MaxValue;
        }
    }
}
