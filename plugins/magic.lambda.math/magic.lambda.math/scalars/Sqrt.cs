/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.math.scalars
{
    /// <summary>
    /// [math.sqrt] slot for finding square root.
    /// </summary>
    [Slot(
        Name = "math.sqrt",
        Description = "Calculates the square root of the specified value",
        ValueKind = "number",
        ValueDescription = "Numeric value to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "number",
        ReturnsDescription = "Resolves to the square root of the supplied value")]
    public class Sqrt : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            var original = input.GetEx<double>();
            input.Value = Math.Sqrt(original);
        }
    }
}
